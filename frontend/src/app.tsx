import * as React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import Setup from './components/setup/setup';
import Thanks from './components/setup/thanks';
import FrontPage from './components/frontpage';
import AdminPage from './components/admin';
import LegalDoc from './components/legal/legaldocument';
import { terms } from './constants/terms';
import { privacypol } from './constants/privacypolicy';

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
                    <LegalDoc contents={privacypol} />
                </Route>
                <Route path="/skilmalar">
                    <LegalDoc contents={terms} />
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
};

export default App;
