import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './globals.css';
import { MessengerProvider } from './context/MessengerContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <MessengerProvider>
    <App />
  </MessengerProvider>
);