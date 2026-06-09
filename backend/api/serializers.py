from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Computer, Zona, UserProfile

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active']

class UserCreateSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=UserProfile.ROLES, write_only=True)
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'first_name', 'last_name', 'role']

    def create(self, validated_data):
        role = validated_data.pop('role')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        UserProfile.objects.create(user=user, role=role)
        return user

class ZonaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zona
        fields = '__all__'

class ComputerSerializer(serializers.ModelSerializer):
    zona_nombre = serializers.ReadOnlyField(source='zona.nombre')

    class Meta:
        model = Computer
        fields = '__all__'
