import json
from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
import os
from .models import Computer, Zona, UserProfile
from .serializers import ComputerSerializer, ZonaSerializer, UserSerializer, UserCreateSerializer

class IsAdminUserRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'ADMINISTRADOR')

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class PasswordResetRequestView(APIView):
    permission_classes = []
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email requerido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"message": "Si la cuenta existe, se ha enviado un correo."})
        
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
        reset_link = f"{frontend_url}/reset-password?uid={uid}&token={token}"
        
        try:
            send_mail(
                subject='Recuperación de Cuenta y Contraseña - CTSI',
                message=f'Hola {user.first_name or user.username},\n\nTu nombre de usuario para ingresar al sistema es: {user.username}\n\nHas solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:\n\n{reset_link}\n\nSi no fuiste tú, ignora este correo.',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({"error": f"Error enviando el correo: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response({"message": "Si la cuenta existe, se ha enviado un correo."})

class PasswordResetConfirmView(APIView):
    permission_classes = []
    
    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('password')
        
        if not uidb64 or not token or not new_password:
            return Response({"error": "Faltan parámetros"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None
            
        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({"message": "Contraseña actualizada correctamente"})
        else:
            return Response({"error": "Enlace inválido o caducado"}, status=status.HTTP_400_BAD_REQUEST)

class ZonaViewSet(viewsets.ModelViewSet):
    queryset = Zona.objects.all()
    serializer_class = ZonaSerializer
    permission_classes = [IsAuthenticated]

class ComputerList(generics.ListAPIView):
    serializer_class = ComputerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Computer.objects.all()
        zona_id = self.request.query_params.get('zona', None)
        unassigned = self.request.query_params.get('unassigned', None)
        
        if unassigned == 'true':
            queryset = queryset.filter(zona__isnull=True)
        elif zona_id is not None:
            queryset = queryset.filter(zona_id=zona_id)
        return queryset

class ComputerDelete(generics.DestroyAPIView):
    queryset = Computer.objects.all()
    serializer_class = ComputerSerializer
    permission_classes = [IsAuthenticated]

class ComputerUpdateZone(generics.UpdateAPIView):
    queryset = Computer.objects.all()
    serializer_class = ComputerSerializer
    permission_classes = [IsAuthenticated]
    
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
    permission_classes = [IsAuthenticated]

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

            # Compare to detect removals
            alertas_remocion = {"programas": [], "hardware": [], "discos": []}
            existing_computer = Computer.objects.filter(hostname=hostname).first()
            
            new_programas = data.get('programas', [])
            new_hardware = data.get('hardware_extra', [])
            new_discos = data.get('discos_detalle', [])
            
            if existing_computer:
                old_discos = [d.get("modelo") for d in existing_computer.discos_detalle]
                new_discos_names = [d.get("modelo") for d in new_discos]
                for od in old_discos:
                    if od and od not in new_discos_names:
                        alertas_remocion["discos"].append(od)
                        
                old_hw = [h.get("modelo") for h in existing_computer.hardware_extra]
                new_hw_names = [h.get("modelo") for h in new_hardware]
                for oh in old_hw:
                    if oh and oh not in new_hw_names:
                        alertas_remocion["hardware"].append(oh)
                        
                old_prog = [p.get("nombre") for p in existing_computer.programas]
                new_prog_names = [p.get("nombre") for p in new_programas]
                for op in old_prog:
                    if op and op not in new_prog_names:
                        alertas_remocion["programas"].append(op)
                        
                old_ram = float(existing_computer.ram_gb) if existing_computer.ram_gb else 0.0
                new_ram = float(data.get('ram_gb', 0.0))
                if old_ram > 0 and new_ram < old_ram:
                    alertas_remocion["hardware"].append(f"RAM reducida de {old_ram}GB a {new_ram}GB")
                    
                old_proc = existing_computer.processor
                new_proc = data.get('processor', '')
                if old_proc and new_proc and old_proc != new_proc:
                    alertas_remocion["hardware"].append(f"Procesador cambiado. Era: {old_proc}")
                        
                old_alertas = existing_computer.alertas_remocion or {"programas": [], "hardware": [], "discos": []}
                import datetime
                timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                for key in ["programas", "hardware", "discos"]:
                    for item in alertas_remocion[key]:
                        already_alerted = any(a.get("elemento") == item for a in old_alertas.get(key, []))
                        if not already_alerted:
                            old_alertas.setdefault(key, []).append({"elemento": item, "fecha_detectado": timestamp})
                
                alertas_remocion = old_alertas
            else:
                alertas_remocion = {"programas": [], "hardware": [], "discos": []}

            computer, created = Computer.objects.update_or_create(
                hostname=hostname,
                defaults={
                    'alias': data.get('alias', None),
                    'os_version': data.get('os_version', ''),
                    'motherboard': data.get('motherboard', ''),
                    'bios_version': data.get('bios_version', ''),
                    'mac_address': data.get('mac_address', ''),
                    'processor': data.get('processor', ''),
                    'ram_gb': data.get('ram_gb', 0.0),
                    'tipo_ram': data.get('tipo_ram', 'Desconocido'),
                    'storage_gb': data.get('storage_gb', 0.0),
                    'tipo_disco': data.get('tipo_disco', 'Desconocido (OS Legacy)'),
                    'discos_detalle': new_discos,
                    'programas': new_programas,
                    'hardware_extra': new_hardware,
                    'alertas_remocion': alertas_remocion,
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

class DownloadCollectorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            file_path = os.path.join(settings.BASE_DIR, '..', 'collector', 'dist', 'collector.exe')
            file_path = os.path.normpath(file_path)
            
            if os.path.exists(file_path):
                response = FileResponse(open(file_path, 'rb'), as_attachment=True, filename='collector.exe')
                return response
            else:
                return Response({"error": "El archivo recolector no se encuentra en el servidor."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
