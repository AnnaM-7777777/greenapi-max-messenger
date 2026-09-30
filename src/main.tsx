import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './globals.css';
import '../public/icons.svg'
import { MessengerProvider } from './context/MessengerContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <MessengerProvider>
    <App />
  </MessengerProvider>
);