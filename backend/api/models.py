from django.db import models

class Zona(models.Model):
    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre

class Computer(models.Model):
    hostname = models.CharField(max_length=255, unique=True)
    mac_address = models.CharField(max_length=255)
    processor = models.CharField(max_length=255)
    ram_gb = models.FloatField()
    tipo_ram = models.CharField(max_length=100, default="Desconocido")
    storage_gb = models.FloatField()
    tipo_disco = models.CharField(max_length=100, default="Desconocido")
    install_date = models.CharField(max_length=255) 
    zona = models.ForeignKey(Zona, on_delete=models.SET_NULL, null=True, blank=True, related_name='computers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.hostname
