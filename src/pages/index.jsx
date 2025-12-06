import Layout from "./Layout.jsx";

import Home from "./Home";

import Tasks from "./Tasks";

import Learning from "./Learning";

import Intelligence from "./Intelligence";

import Inbox from "./Inbox";

import Notes from "./Notes";

import Planner from "./Planner";

import Calendar from "./Calendar";

import Resources from "./Resources";

import Teams from "./Teams";

import Admin from "./Admin";

import Projects from "./Projects";

import GoalsKPIs from "./GoalsKPIs";

import Privacy from "./Privacy";

import TeamInsights from "./TeamInsights";

import MySupport from "./MySupport";

import IntakeReferrals from "./IntakeReferrals";

import Cases from "./Cases";

import StrengthsChallenges from "./StrengthsChallenges";

import ManagerGuidance from "./ManagerGuidance";

import AlignmentPlans from "./AlignmentPlans";

import SupportInsights from "./SupportInsights";

import SupportAdmin from "./SupportAdmin";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    Tasks: Tasks,
    
    Learning: Learning,
    
    Intelligence: Intelligence,
    
    Inbox: Inbox,
    
    Notes: Notes,
    
    Planner: Planner,
    
    Calendar: Calendar,
    
    Resources: Resources,
    
    Teams: Teams,
    
    Admin: Admin,
    
    Projects: Projects,
    
    GoalsKPIs: GoalsKPIs,
    
    Privacy: Privacy,
    
    TeamInsights: TeamInsights,
    
    MySupport: MySupport,
    
    IntakeReferrals: IntakeReferrals,
    
    Cases: Cases,
    
    StrengthsChallenges: StrengthsChallenges,
    
    ManagerGuidance: ManagerGuidance,
    
    AlignmentPlans: AlignmentPlans,
    
    SupportInsights: SupportInsights,
    
    SupportAdmin: SupportAdmin,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Tasks" element={<Tasks />} />
                
                <Route path="/Learning" element={<Learning />} />
                
                <Route path="/Intelligence" element={<Intelligence />} />
                
                <Route path="/Inbox" element={<Inbox />} />
                
                <Route path="/Notes" element={<Notes />} />
                
                <Route path="/Planner" element={<Planner />} />
                
                <Route path="/Calendar" element={<Calendar />} />
                
                <Route path="/Resources" element={<Resources />} />
                
                <Route path="/Teams" element={<Teams />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Projects" element={<Projects />} />
                
                <Route path="/GoalsKPIs" element={<GoalsKPIs />} />
                
                <Route path="/Privacy" element={<Privacy />} />
                
                <Route path="/TeamInsights" element={<TeamInsights />} />
                
                <Route path="/MySupport" element={<MySupport />} />
                
                <Route path="/IntakeReferrals" element={<IntakeReferrals />} />
                
                <Route path="/Cases" element={<Cases />} />
                
                <Route path="/StrengthsChallenges" element={<StrengthsChallenges />} />
                
                <Route path="/ManagerGuidance" element={<ManagerGuidance />} />
                
                <Route path="/AlignmentPlans" element={<AlignmentPlans />} />
                
                <Route path="/SupportInsights" element={<SupportInsights />} />
                
                <Route path="/SupportAdmin" element={<SupportAdmin />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}