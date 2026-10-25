'use client';

import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Code2, Cpu } from 'lucide-react';

export interface DsaUsedItem {
  name: string;
  purpose: string;
  application: string;
  timeComplexity: string;
}

interface DsaUsedSectionProps {
  items: DsaUsedItem[];
  defaultOpen?: boolean;
  pageContext?: string;
}

export default function DsaUsedSection({
  items,
  defaultOpen = true,
  pageContext,
}: DsaUsedSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section
      className="card"
      style={{
        marginTop: 28,
        border: '1px solid rgba(220, 38, 38, 0.25)',
        background: 'linear-gradient(180deg, rgba(13, 17, 29, 0.95) 0%, rgba(5, 8, 16, 0.98) 100%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '14px 18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
          borderBottom: isOpen ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
          background: 'rgba(220, 38, 38, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: 'rgba(220, 38, 38, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(220, 38, 38, 0.3)',
            }}
          >
            <Cpu size={14} color="#dc2626" />
          </div>
          <div>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#f1f5f9',
                margin: 0,
                letterSpacing: '0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>DSA Used on This Page</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#dc2626',
                  background: 'rgba(220, 38, 38, 0.12)',
                  padding: '1px 7px',
                  borderRadius: 12,
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                }}
              >
                {items.length} {items.length === 1 ? 'Concept' : 'Concepts'}
              </span>
            </h3>
            {pageContext && (
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{pageContext}</p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 12 }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>{isOpen ? 'Collapse' : 'Expand'}</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: '16px 18px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: 12,
            }}
          >
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#f1f5f9' }}>
                    {item.name}
                  </div>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#38bdf8',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      padding: '1px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {item.timeComplexity.split(';')[0].trim()}
                  </span>
                </div>

                <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.5 }}>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>Purpose: </span>
                  {item.purpose}
                </div>

                <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.5 }}>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>Application: </span>
                  {item.application}
                </div>

                <div
                  style={{
                    fontSize: 10,
                    color: '#38bdf8',
                    lineHeight: 1.4,
                    background: 'rgba(56, 189, 248, 0.04)',
                    padding: '6px 8px',
                    borderRadius: 4,
                    borderLeft: '2px solid #38bdf8',
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#7dd3fc' }}>Time Complexity: </span>
                  {item.timeComplexity}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
