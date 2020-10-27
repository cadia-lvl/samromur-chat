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
import Terms from './components/skilmalar';
import PrivacyPolicy from './components/personuvernd';

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
				<Route path="/personuvernd">
					<PrivacyPolicy />
				</Route>
				<Route path="/skilmalar">
					<Terms />
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
