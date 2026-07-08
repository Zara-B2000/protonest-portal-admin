function Bone({ w, h, r = 6 }: { w: string | number; h: number; r?: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: "var(--border)",
        animation: "skeletonPulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

export default function DashboardLoading() {
  return (
    <>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: .45; }
          50%       { opacity: .22; }
        }
      `}</style>

      {/* Line-status strip placeholder */}
      <div className="line-status-strip" style={{ gap: 16, alignItems: "center" }}>
        {[140, 120, 150, 80].map((w, i) => (
          <Bone key={i} w={w} h={12} r={4} />
        ))}
      </div>

      {/* Page header */}
      <div className="page-header">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Bone w={90} h={11} r={3} />
          <Bone w={220} h={28} r={7} />
          <Bone w={160} h={11} r={3} />
        </div>
      </div>

      {/* Stats grid — 4 cards */}
      <div className="stats">
        {[...Array(4)].map((_, i) => (
          <div className="sc" key={i} style={{ pointerEvents: "none" }}>
            <div className="sc-top">
              <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--border)", animation: "skeletonPulse 1.4s ease-in-out infinite" }} />
              <Bone w={52} h={22} r={6} />
            </div>
            <Bone w="55%" h={36} r={7} />
            <div style={{ marginTop: 6 }}>
              <Bone w="75%" h={12} r={4} />
            </div>
            <div className="sc-bar" style={{ marginTop: 14 }}>
              <div className="sc-bar-fill" style={{ width: `${30 + i * 15}%`, background: "var(--border2)", transition: "none" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="main-grid">
        {/* Left column — two table cards */}
        <div className="left-col">
          {[0, 1].map((ci) => (
            <div className="card" key={ci} style={{ animation: "none" }}>
              {/* Card header */}
              <div className="card-head">
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--border)", animation: "skeletonPulse 1.4s ease-in-out infinite", flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                  <Bone w="50%" h={14} r={4} />
                  <Bone w="65%" h={11} r={3} />
                </div>
                <Bone w={70} h={24} r={20} />
              </div>
              {/* Table skeleton */}
              <div className="tbl-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {[70, 90, 120, 50, 60, 80, 72].map((w, j) => (
                        <th key={j} style={{ padding: "10px 16px" }}>
                          <Bone w={w} h={10} r={3} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(3 + ci)].map((_, ri) => (
                      <tr key={ri}>
                        {[60, 110, 140, 30, 60, 70, 80].map((w, j) => (
                          <td key={j} style={{ padding: "14px 16px" }}>
                            <Bone w={w} h={13} r={4} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Right column — three stacked cards */}
        <div className="right-col">
          {/* Revenue */}
          <div className="card" style={{ animation: "none", padding: "18px 20px 20px" }}>
            <Bone w={110} h={14} r={4} />
            <div style={{ marginTop: 16, marginBottom: 6 }}>
              <Bone w="60%" h={32} r={7} />
            </div>
            <Bone w="40%" h={11} r={3} />
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <Bone w={80} h={11} r={3} />
                    <Bone w={60} h={11} r={3} />
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${55 - i * 15}%`, background: "var(--border2)", animation: "skeletonPulse 1.4s ease-in-out infinite" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="card" style={{ animation: "none", padding: "18px 20px 16px" }}>
            <Bone w={100} h={14} r={4} />
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--border)", flexShrink: 0, animation: "skeletonPulse 1.4s ease-in-out infinite" }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <Bone w="70%" h={12} r={3} />
                    <Bone w="85%" h={10} r={3} />
                    <Bone w={50} h={9} r={3} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's summary */}
          <div className="card" style={{ animation: "none", padding: "18px 20px 16px" }}>
            <Bone w={120} h={14} r={4} />
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Bone w={100} h={11} r={3} />
                  <Bone w={36} h={16} r={4} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
