import { useMessenger } from "./context/MessengerContext";
import { AuthScreen } from "./components/AuthScreen/AuthScreen";
import { ChatInterface } from "./components/ChatInterface/ChatInterface";

function App() {
    const { isAuthorized } = useMessenger();

    return isAuthorized ? <ChatInterface /> : <AuthScreen />;
}

export default App;
