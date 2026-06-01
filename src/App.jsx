import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Hub from './agents/Hub.jsx'
import BusinessBrain from './agents/BusinessBrain.jsx'
import LeadConversion from './agents/LeadConversion.jsx'
import MemberSupport from './agents/MemberSupport.jsx'
import MembershipAdmin from './agents/MembershipAdmin.jsx'
import Collections from './agents/Collections.jsx'
import DocumentFinance from './agents/DocumentFinance.jsx'
import Reporting from './agents/Reporting.jsx'
import Operations from './agents/Operations.jsx'

function BackBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  if (pathname === '/') return null
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, height: 44, background: 'rgba(6,10,16,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(57,208,216,0.15)', display: 'flex', alignItems: 'center', paddingLeft: 20, gap: 14 }}>
      <button onClick={() => navigate('/')} style={{ background: 'rgba(57,208,216,0.1)', border: '1px solid rgba(57,208,216,0.3)', borderRadius: 8, padding: '5px 14px', color: '#39D0D8', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>← Hub</button>
      <span style={{ color: '#374151', fontSize: 11 }}>Reset Fitness AI Operations</span>
    </div>
  )
}

function Wrap({ children }) {
  const { pathname } = useLocation()
  return <div style={{ paddingTop: pathname === '/' ? 0 : 44 }}>{children}</div>
}

export default function App() {
  return (
    <BrowserRouter>
      <BackBar />
      <Wrap>
        <Routes>
          <Route path="/"            element={<Hub />} />
          <Route path="/brain"       element={<BusinessBrain />} />
          <Route path="/leads"       element={<LeadConversion />} />
          <Route path="/support"     element={<MemberSupport />} />
          <Route path="/members"     element={<MembershipAdmin />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/finance"     element={<DocumentFinance />} />
          <Route path="/reporting"   element={<Reporting />} />
          <Route path="/operations"  element={<Operations />} />
        </Routes>
      </Wrap>
    </BrowserRouter>
  )
}
