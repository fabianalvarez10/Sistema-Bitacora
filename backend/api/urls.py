from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComputerList, UploadInventory, ZonaViewSet, ComputerUpdateZone

router = DefaultRouter()
router.register(r'zonas', ZonaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('computers/', ComputerList.as_view(), name='computer-list'),
    path('computers/<int:pk>/zona/', ComputerUpdateZone.as_view(), name='computer-update-zone'),
    path('upload-inventory/', UploadInventory.as_view(), name='upload-inventory'),
]
