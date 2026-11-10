"""Agregação do dashboard e alertas in-app (D04: janela de 3 dias)."""

from __future__ import annotations

from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone

from academic_events.models import AcademicEvent
from grades.models import Assessment
from grades.services import compute_subject_grades
from subjects.models import Subject
from tasks.models import Task

ALERT_WINDOW_DAYS = 3
UPCOMING_LIMIT = 8


def build_dashboard(user) -> dict:
    now = timezone.now()
    window_end = now + timedelta(days=ALERT_WINDOW_DAYS)

    subjects_qs = Subject.objects.filter(user=user)
    subject_counts = subjects_qs.aggregate(
        active=Count("id", filter=Q(is_archived=False)),
        archived=Count("id", filter=Q(is_archived=True)),
    )

    tasks_qs = Task.objects.filter(user=user)
    task_counts = tasks_qs.aggregate(
        pending=Count("id", filter=Q(status=Task.Status.PENDING)),
        in_progress=Count("id", filter=Q(status=Task.Status.IN_PROGRESS)),
        done=Count("id", filter=Q(status=Task.Status.DONE)),
    )
    task_counts["open"] = task_counts["pending"] + task_counts["in_progress"]

    upcoming_events = list(
        AcademicEvent.objects.filter(
            user=user,
            status=AcademicEvent.Status.SCHEDULED,
            start_at__gte=now,
        )
        .select_related("subject")
        .order_by("start_at")[:UPCOMING_LIMIT]
    )

    upcoming_tasks = list(
        Task.objects.filter(user=user)
        .exclude(status=Task.Status.DONE)
        .filter(due_at__isnull=False, due_at__gte=now)
        .select_related("subject")
        .order_by("due_at")[:UPCOMING_LIMIT]
    )

    alerts = _build_alerts(user=user, now=now, window_end=window_end)

    active_subjects = list(subjects_qs.filter(is_archived=False).order_by("name"))
    assessments = Assessment.objects.filter(
        user=user,
        subject_id__in=[s.id for s in active_subjects],
    )
    by_subject: dict[int, list] = {}
    for item in assessments:
        by_subject.setdefault(item.subject_id, []).append(item)

    grade_highlights = []
    for subject in active_subjects:
        grade = compute_subject_grades(
            passing_grade=subject.passing_grade,
            assessments=by_subject.get(subject.id, []),
        )
        if grade["current_average"] is None:
            continue
        grade_highlights.append(
            {
                "subject_id": subject.id,
                "subject_name": subject.name,
                "subject_color": subject.color,
                "passing_grade": grade["passing_grade"],
                "current_average": grade["current_average"],
                "already_passing": grade["already_passing"],
                "needed_on_remaining": grade["needed_on_remaining"],
                "needed_feasible": grade["needed_feasible"],
            }
        )

    return {
        "generated_at": now.isoformat(),
        "alert_window_days": ALERT_WINDOW_DAYS,
        "subjects": subject_counts,
        "tasks": task_counts,
        "upcoming_events": [_serialize_event(e) for e in upcoming_events],
        "upcoming_tasks": [_serialize_task(t) for t in upcoming_tasks],
        "alerts": alerts,
        "grade_highlights": grade_highlights,
    }


def _build_alerts(*, user, now, window_end) -> list[dict]:
    alerts: list[dict] = []

    events = (
        AcademicEvent.objects.filter(user=user, status=AcademicEvent.Status.SCHEDULED)
        .select_related("subject")
        .order_by("start_at")
    )
    for event in events:
        when = event.due_at or event.start_at
        severity = _severity(when, now=now, window_end=window_end)
        if not severity:
            continue
        alerts.append(
            {
                "id": f"event-{event.id}",
                "kind": "event",
                "ref_id": event.id,
                "severity": severity,
                "title": event.title,
                "subtitle": _event_type_label(event.event_type),
                "when": when.isoformat(),
                "subject_id": event.subject_id,
                "subject_name": event.subject.name if event.subject_id else None,
            }
        )

    tasks = (
        Task.objects.filter(user=user)
        .exclude(status=Task.Status.DONE)
        .filter(due_at__isnull=False)
        .select_related("subject")
        .order_by("due_at")
    )
    for task in tasks:
        severity = _severity(task.due_at, now=now, window_end=window_end)
        if not severity:
            continue
        alerts.append(
            {
                "id": f"task-{task.id}",
                "kind": "task",
                "ref_id": task.id,
                "severity": severity,
                "title": task.title,
                "subtitle": "Tarefa",
                "when": task.due_at.isoformat(),
                "subject_id": task.subject_id,
                "subject_name": task.subject.name if task.subject_id else None,
            }
        )

    severity_rank = {"overdue": 0, "due_soon": 1}
    alerts.sort(key=lambda a: (severity_rank[a["severity"]], a["when"]))
    return alerts


def _severity(when, *, now, window_end):
    if when is None:
        return None
    if when < now:
        return "overdue"
    if when <= window_end:
        return "due_soon"
    return None


def _event_type_label(event_type: str) -> str:
    return {
        AcademicEvent.EventType.EXAM: "Prova",
        AcademicEvent.EventType.ASSIGNMENT: "Trabalho",
        AcademicEvent.EventType.OTHER: "Evento",
    }.get(event_type, "Evento")


def _serialize_event(event: AcademicEvent) -> dict:
    return {
        "id": event.id,
        "title": event.title,
        "event_type": event.event_type,
        "start_at": event.start_at.isoformat(),
        "due_at": event.due_at.isoformat() if event.due_at else None,
        "subject_id": event.subject_id,
        "subject_name": event.subject.name if event.subject_id else None,
    }


def _serialize_task(task: Task) -> dict:
    return {
        "id": task.id,
        "title": task.title,
        "status": task.status,
        "priority": task.priority,
        "due_at": task.due_at.isoformat() if task.due_at else None,
        "subject_id": task.subject_id,
        "subject_name": task.subject.name if task.subject_id else None,
    }
