import React, { useState } from 'react';
import { Card, CardBody, Input, Button } from '@nextui-org/react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('');
    try {
      await api.post('/auth/password_reset/', { email });
      setStatus('success');
    } catch (error) {
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md bg-white border border-gray-200 shadow-xl">
        <CardBody className="p-8">
          <Link to="/login" className="flex items-center text-gray-500 hover:text-orange-500 mb-6 w-fit">
            <ArrowLeft size={16} className="mr-1" /> Volver al Login
          </Link>
          
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="p-4 bg-orange-100 rounded-full mb-4">
              <Mail size={32} className="text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Recuperar Contraseña</h1>
            <p className="text-gray-500 text-sm mt-2">
              Ingresa tu correo electrónico registrado y te enviaremos un enlace para crear una contraseña nueva.
            </p>
          </div>

          {status === 'success' ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center text-sm border border-green-200 font-medium">
              ¡Revisa tu bandeja de entrada! Si el correo existe en nuestro sistema, te hemos enviado un enlace de recuperación.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="email"
                label="Correo Electrónico"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                startContent={<Mail size={18} className="text-gray-400" />}
                variant="bordered"
                isRequired
              />

              {status === 'error' && <p className="text-red-500 text-sm text-center">Ocurrió un error al intentar enviar el correo. Por favor contacta con el administrador del sistema.</p>}

              <Button 
                type="submit" 
                color="primary" 
                className="w-full mt-2 font-bold shadow-md shadow-orange-500/20"
                isLoading={isLoading}
              >
                Enviar Enlace
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
