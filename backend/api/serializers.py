from rest_framework import serializers
from .models import Computer, Zona

class ZonaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zona
        fields = '__all__'

class ComputerSerializer(serializers.ModelSerializer):
    zona_nombre = serializers.ReadOnlyField(source='zona.nombre')

    class Meta:
        model = Computer
        fields = '__all__'
