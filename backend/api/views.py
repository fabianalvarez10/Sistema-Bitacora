import json
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Computer
from .serializers import ComputerSerializer

class ComputerList(generics.ListAPIView):
    serializer_class = ComputerSerializer

    def get_queryset(self):
        queryset = Computer.objects.all()
        location = self.request.query_params.get('location', None)
        if location is not None:
            queryset = queryset.filter(location=location)
        return queryset

class UploadInventory(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            data = json.load(file_obj)
            
            # Use hostname as the unique identifier to update or create
            hostname = data.get('hostname')
            if not hostname:
                return Response({"error": "Hostname is missing in the JSON data"}, status=status.HTTP_400_BAD_REQUEST)

            # Update or Create
            computer, created = Computer.objects.update_or_create(
                hostname=hostname,
                defaults={
                    'mac_address': data.get('mac_address', ''),
                    'processor': data.get('processor', ''),
                    'ram_gb': data.get('ram_gb', 0.0),
                    'storage_gb': data.get('storage_gb', 0.0),
                    'install_date': data.get('install_date', ''),
                    'location': data.get('location', 'Laboratorios de Informática')
                }
            )

            serializer = ComputerSerializer(computer)
            return Response({
                "message": "Data processed successfully", 
                "created": created,
                "data": serializer.data
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            
        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON file"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
