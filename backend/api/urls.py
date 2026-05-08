from django.urls import path
from .views import ComputerList, UploadInventory

urlpatterns = [
    path('computers/', ComputerList.as_view(), name='computer-list'),
    path('upload-inventory/', UploadInventory.as_view(), name='upload-inventory'),
]
