import json
from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Computer, Zona
from .serializers import ComputerSerializer, ZonaSerializer

class ZonaViewSet(viewsets.ModelViewSet):
    queryset = Zona.objects.all()
    serializer_class = ZonaSerializer

class ComputerList(generics.ListAPIView):
    serializer_class = ComputerSerializer

    def get_queryset(self):
        queryset = Computer.objects.all()
        zona_id = self.request.query_params.get('zona', None)
        unassigned = self.request.query_params.get('unassigned', None)
        
        if unassigned == 'true':
            queryset = queryset.filter(zona__isnull=True)
        elif zona_id is not None:
            queryset = queryset.filter(zona_id=zona_id)
        return queryset

class ComputerUpdateZone(generics.UpdateAPIView):
    queryset = Computer.objects.all()
    serializer_class = ComputerSerializer
    
    def patch(self, request, *args, **kwargs):
        computer = self.get_object()
        zona_id = request.data.get('zona_id')
        if zona_id is None:
            computer.zona = None
        else:
            try:
                zona = Zona.objects.get(id=zona_id)
                computer.zona = zona
            except Zona.DoesNotExist:
                return Response({"error": "Zona not found"}, status=status.HTTP_404_NOT_FOUND)
        
        computer.save()
        serializer = self.get_serializer(computer)
        return Response(serializer.data)

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
                    'tipo_ram': data.get('tipo_ram', 'Desconocido'),
                    'storage_gb': data.get('storage_gb', 0.0),
                    'tipo_disco': data.get('tipo_disco', 'Desconocido (OS Legacy)'),
                    'install_date': data.get('install_date', ''),
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
