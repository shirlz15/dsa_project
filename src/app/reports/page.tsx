'use client';

import { useStore } from '@/lib/store';
import { FileDown, Download } from 'lucide-react';
import { useState } from 'react';

function exportToCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const inventory = useStore((s) => s.inventory);
  const requests = useStore((s) => s.requests);
  const transfers = useStore((s) => s.transfers);
  const bloodBanks = useStore((s) => s.bloodBanks);
  const getNow = useStore((s) => s.getNow);
  const now = getNow();

  const getBankName = (id: string) => bloodBanks.find((b) => b.id === id)?.name || id;

  const exportInventory = () => {
    const headers = ['ID', 'Blood Bank', 'Blood Type', 'Component', 'Quantity', 'Status', 'Expiry', 'Remaining Hours'];
    const rows = inventory.map((u) => [
      u.id, getBankName(u.bloodBankId), u.bloodType, u.componentType, String(u.quantity), u.status,
      u.expiryTimestamp, String(Math.round((new Date(u.expiryTimestamp).getTime() - now) / 3600000)),
    ]);
    exportToCSV('blood_inventory_report.csv', headers, rows);
  };

  const exportRequests = () => {
    const headers = ['ID', 'Destination', 'Blood Type', 'Component', 'Quantity', 'Priority', 'Status', 'Needed By', 'Notes'];
    const rows = requests.map((r) => [r.id, getBankName(r.destinationBankId), r.bloodType, r.componentType, String(r.quantity), r.priority, r.status, r.neededBy, r.notes]);
    exportToCSV('blood_requests_report.csv', headers, rows);
  };

  const exportTransfers = () => {
    const headers = ['ID', 'Source', 'Destination', 'Status', 'Transport Min', 'Processing Min', 'Safety Min', 'Usable After Min', 'Created'];
    const rows = transfers.map((t) => [t.id, getBankName(t.sourceBankId), getBankName(t.destinationBankId), t.status, String(t.transportDuration), String(t.receivingProcessingDuration), String(t.safetyMargin), String(t.usableTimeAfterTransfer), t.createdAt]);
    exportToCSV('transfers_report.csv', headers, rows);
  };

  return (
    <>
      <div className="page-header"><h1>Reports & Export</h1><p>Export current application data as CSV for analysis</p></div>
      <div className="page-content">
        <div className="grid-3">
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: 32 }}>
              <FileDown size={36} style={{ color: 'var(--accent-primary)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 15, marginBottom: 8 }}>Inventory Report</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{inventory.length} units across {bloodBanks.length} banks</p>
              <button className="btn btn-primary" onClick={exportInventory}><Download size={16} /> Export CSV</button>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: 32 }}>
              <FileDown size={36} style={{ color: 'var(--status-info)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 15, marginBottom: 8 }}>Requests Report</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{requests.length} total requests</p>
              <button className="btn btn-primary" onClick={exportRequests}><Download size={16} /> Export CSV</button>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: 32 }}>
              <FileDown size={36} style={{ color: 'var(--status-normal)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 15, marginBottom: 8 }}>Transfers Report</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{transfers.length} transfer records</p>
              <button className="btn btn-primary" onClick={exportTransfers}><Download size={16} /> Export CSV</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
