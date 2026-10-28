import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/pages.css';
import './styles/animations.css';
import './styles/polish.css';

// StrictMode is intentionally off: in development it runs every data load twice,
// which doubles API calls against the backend's rate limit.
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
