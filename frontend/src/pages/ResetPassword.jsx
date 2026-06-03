import React, { useState, useEffect } from 'react';
import { Card, CardBody, Input, Button } from '@nextui-org/react';
import { Lock, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!uid || !token) {
      setStatus('invalid_link');
    }
  }, [uid, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus('mismatch');
      return;
    }
    
    setIsLoading(true);
    setStatus('');
    
    try {
      await api.post('/auth/password_reset/confirm/', {
        uid,
        token,
        password
      });
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'invalid_link') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md bg-white border border-gray-200">
          <CardBody className="p-8 text-center">
            <h1 className="text-xl font-bold text-red-500 mb-2">Enlace Inválido</h1>
            <p className="text-gray-600 mb-6">El enlace de recuperación es incorrecto o ha caducado.</p>
            <Button color="primary" variant="flat" onClick={() => navigate('/forgot-password')}>
              Volver a solicitar recuperación
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md bg-white border border-gray-200 shadow-xl">
        <CardBody className="p-8">
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="p-4 bg-orange-100 rounded-full mb-4">
              <Lock size={32} className="text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Nueva Contraseña</h1>
            <p className="text-gray-500 text-sm mt-2">
              Ingresa tu nueva contraseña para acceder al sistema.
            </p>
          </div>

          {status === 'success' ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center text-sm border border-green-200 font-medium flex flex-col gap-4 items-center">
              <span>¡Contraseña actualizada con éxito!</span>
              <span className="text-xs">Redirigiendo al Login...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="password"
                label="Nueva Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                startContent={<Lock size={18} className="text-gray-400" />}
                variant="bordered"
                isRequired
              />
              <Input
                type="password"
                label="Confirmar Contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                startContent={<Lock size={18} className="text-gray-400" />}
                variant="bordered"
                isRequired
              />

              {status === 'mismatch' && <p className="text-red-500 text-sm text-center">Las contraseñas no coinciden.</p>}
              {status === 'error' && <p className="text-red-500 text-sm text-center">El enlace es inválido o ha caducado.</p>}

              <Button 
                type="submit" 
                color="primary" 
                className="w-full mt-2 font-bold shadow-md shadow-orange-500/20"
                isLoading={isLoading}
                endContent={!isLoading && <ArrowRight size={18} />}
              >
                Actualizar Contraseña
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
