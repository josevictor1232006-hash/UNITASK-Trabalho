from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .dashboard import build_dashboard


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok", "service": "unitask-api"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):
    return Response(build_dashboard(request.user))
