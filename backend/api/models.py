from django.db import models

class Computer(models.Model):
    LOCATION_CHOICES = [
        ('Laboratorios de Informática', 'Laboratorios de Informática'),
        ('Oficinas VPDS', 'Oficinas VPDS'),
    ]

    hostname = models.CharField(max_length=255, unique=True)
    mac_address = models.CharField(max_length=255)
    processor = models.CharField(max_length=255)
    ram_gb = models.FloatField()
    storage_gb = models.FloatField()
    install_date = models.CharField(max_length=255) # We keep it as CharField for flexibility since it might just be a string from WMI
    location = models.CharField(max_length=100, choices=LOCATION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.hostname} ({self.location})"
