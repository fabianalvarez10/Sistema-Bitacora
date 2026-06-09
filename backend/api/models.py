from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    ROLES = (
        ('ADMINISTRADOR', 'Administrador'),
        ('JEFE_UNIDAD', 'Jefe de Unidad'),
        ('TECNICO', 'Técnico')
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=50, choices=ROLES, default='TECNICO')

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

class Zona(models.Model):
    CATEGORIAS = (
        ('LABORATORIO', 'Laboratorios'),
        ('VPDS', 'VPDS'),
        ('OTRO', 'Otras Áreas')
    )
    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    categoria = models.CharField(max_length=20, choices=CATEGORIAS, default='OTRO')

    def __str__(self):
        return self.nombre

class Computer(models.Model):
    hostname = models.CharField(max_length=255, unique=True)
    alias = models.CharField(max_length=255, blank=True, null=True)
    os_version = models.CharField(max_length=255, blank=True, null=True)
    motherboard = models.CharField(max_length=255, blank=True, null=True)
    bios_version = models.CharField(max_length=255, blank=True, null=True)
    mac_address = models.CharField(max_length=255)
    processor = models.CharField(max_length=255)
    ram_gb = models.FloatField()
    tipo_ram = models.CharField(max_length=100, default="Desconocido")
    storage_gb = models.FloatField()
    tipo_disco = models.CharField(max_length=100, default="Desconocido")
    discos_detalle = models.JSONField(default=list)
    programas = models.JSONField(default=list)
    hardware_extra = models.JSONField(default=list)
    alertas_remocion = models.JSONField(default=dict)
    install_date = models.CharField(max_length=255) 
    zona = models.ForeignKey(Zona, on_delete=models.SET_NULL, null=True, blank=True, related_name='computers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.hostname
