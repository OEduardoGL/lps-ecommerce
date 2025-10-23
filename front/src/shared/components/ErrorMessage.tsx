import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage = ({ message }: ErrorMessageProps) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-3 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
        <AlertCircle className="h-5 w-5" />
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
