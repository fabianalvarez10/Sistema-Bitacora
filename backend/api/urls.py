from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import ComputerList, UploadInventory, ZonaViewSet, ComputerUpdateZone, ComputerDelete, UserViewSet, CurrentUserView, PasswordResetRequestView, PasswordResetConfirmView, DownloadCollectorView, CustomTokenObtainPairView

router = DefaultRouter()
router.register(r'zonas', ZonaViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='current_user'),
    path('auth/password_reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('auth/password_reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('', include(router.urls)),
    path('computers/', ComputerList.as_view(), name='computer-list'),
    path('computers/<int:pk>/', ComputerDelete.as_view(), name='computer-delete'),
    path('computers/<int:pk>/zona/', ComputerUpdateZone.as_view(), name='computer-update-zone'),
    path('upload-inventory/', UploadInventory.as_view(), name='upload-inventory'),
    path('download-collector/', DownloadCollectorView.as_view(), name='download-collector'),
]
