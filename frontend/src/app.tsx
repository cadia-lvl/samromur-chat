import * as React from 'react';
import {
	BrowserRouter as Router,
	Switch,
	Route
} from "react-router-dom";

import Setup from './components/setup/setup';
import Thanks from './components/setup/thanks';
import FrontPage from './components/frontpage';
import AdminPage from './components/admin';

export const App: React.FunctionComponent = () => {
	return (
		<Router>
			<Switch>
				<Route path="/takk">
					<Thanks />
				</Route>
				<Route path="/mamma">
					<AdminPage />
				</Route>
				<Route path="/:roomId">
					<Setup />
				</Route>
				<Route path="/">
					<FrontPage />
				</Route>
			</Switch>
		</Router>
	);
}

export default App;