export interface CanonArc {
  from: number;
  to: number;
  title: string;
  arcName?: string;
}

export const BKP_CANON_ARCS: CanonArc[] = [
  { from: 2376, to: 2378, title: "(2376-2378)", arcName: "" },
  { from: 2379, to: 2416, title: "(2379-2416) Nam nhân toàn thế giới đều yêu ta", arcName: "Nam nhân toàn thế giới đều yêu ta" },
  { from: 2417, to: 2458, title: "(2417-2458)", arcName: "" },
  { from: 2459, to: 2484, title: "(2459-2484) Cường thế nữ nhân", arcName: "Cường thế nữ nhân" },
  { from: 2485, to: 2494, title: "(2485-2494)", arcName: "" },
  { from: 2495, to: 2511, title: "(2495-2511) Nhiệm vụ hệ thống", arcName: "Nhiệm vụ hệ thống" },
  { from: 2512, to: 2526, title: "(2512-2526)", arcName: "" },
  { from: 2527, to: 2539, title: "(2527-2539) Bay qua bệnh viện tâm thần", arcName: "Bay qua bệnh viện tâm thần" },
  { from: 2540, to: 2552, title: "(2540-2552)", arcName: "" },
  { from: 2553, to: 2587, title: "(2553-2587) Một bước lên mây", arcName: "Một bước lên mây" },
  { from: 2588, to: 2602, title: "(2588-2602)", arcName: "" },
  { from: 2603, to: 2642, title: "(2603-2642) Quy lai", arcName: "Quy lai" },
  { from: 2643, to: 2654, title: "(2643-2654)", arcName: "" },
  { from: 2655, to: 2682, title: "(2655-2682) Luyện kim sĩ", arcName: "Luyện kim sĩ" },
  { from: 2683, to: 2696, title: "(2683-2696)", arcName: "" },
  { from: 2697, to: 2731, title: "(2697-2731) Kẻ đổ vỏ", arcName: "Kẻ đổ vỏ" },
  { from: 2732, to: 2747, title: "(2732-2747)", arcName: "" },
  { from: 2748, to: 2773, title: "(2748-2773) Dưỡng thành kế hoạch", arcName: "Dưỡng thành kế hoạch" },
  { from: 2774, to: 2802, title: "(2774-2802)", arcName: "" },
  { from: 2803, to: 2824, title: "(2803-2824) Bị quỷ quấn thân", arcName: "Bị quỷ quấn thân" },
  { from: 2825, to: 2839, title: "(2825-2839)", arcName: "" },
  { from: 2840, to: 2855, title: "(2840-2855) Giải trí tối thượng", arcName: "Giải trí tối thượng" },
  { from: 2856, to: 2903, title: "(2856-2903)", arcName: "" },
  { from: 2904, to: 2934, title: "(2904-2934) Không đứng đắn thế giới", arcName: "Không đứng đắn thế giới" },
  { from: 2935, to: 2949, title: "(2935-2949)", arcName: "" },
  { from: 2950, to: 2973, title: "(2950-2973) Mỹ nhân ngư", arcName: "Mỹ nhân ngư" },
  { from: 2974, to: 3049, title: "(2974-3049)", arcName: "" },
  { from: 3050, to: 3078, title: "(3050-3078) Biểu ca biểu muội", arcName: "Biểu ca biểu muội" },
  { from: 3079, to: 3101, title: "(3079-3101)", arcName: "" },
  { from: 3102, to: 3119, title: "(3102-3119) Thay trời hành đạo", arcName: "Thay trời hành đạo" },
  { from: 3120, to: 3131, title: "(3120-3131)", arcName: "" },
  { from: 3132, to: 3145, title: "(3132-3145) Đặc thù nhiệm vụ", arcName: "Đặc thù nhiệm vụ" },
  { from: 3146, to: 3191, title: "(3146-3191)", arcName: "" },
  { from: 3192, to: 3205, title: "(3192-3205) Mật Giai", arcName: "Mật Giai" },
  { from: 3206, to: 3255, title: "(3206-3255)", arcName: "" },
  { from: 3256, to: 3272, title: "(3256-3272) Nhiệm vụ", arcName: "Nhiệm vụ" },
  { from: 3273, to: 3306, title: "(3273-3306)", arcName: "" },
  { from: 3307, to: 3343, title: "(3307-3343) Thầy tướng", arcName: "Thầy tướng" },
  { from: 3344, to: 3371, title: "(3344-3371)", arcName: "" },
  { from: 3372, to: 3398, title: "(3372-3398) Fan cuồng bá đạo", arcName: "Fan cuồng bá đạo" },
  { from: 3399, to: 3422, title: "(3399-3422)", arcName: "" },
  { from: 3423, to: 3456, title: "(3423-3456) Vợ yêu trăm tỷ", arcName: "Vợ yêu trăm tỷ" },
  { from: 3457, to: 3499, title: "(3457-3499)", arcName: "" },
  { from: 3500, to: 3527, title: "(3500-3527) Xung hỉ tân nương", arcName: "Xung hỉ tân nương" }
];

export function findCanonArc(from: number, to: number): string | null {
  // 1. Exact range match
  const exact = BKP_CANON_ARCS.find((a) => a.from === from && a.to === to);
  if (exact) return exact.title;

  // 2. High overlap match (if at least one of the endpoints matches and length is close)
  const close = BKP_CANON_ARCS.find((a) => {
    if (a.from === from && Math.abs(a.to - to) <= 2) return true;
    if (a.to === to && Math.abs(a.from - from) <= 2) return true;
    return false;
  });
  if (close && close.title.includes(" ")) return close.title;

  return null;
}

export function partitionChaptersByCanonArcs(chapters: Array<{ number: number; [key: string]: any }>): Array<{ title: string; chapters: any[] }> | null {
  if (!chapters || chapters.length === 0) return null;

  const chapNumbers = chapters.map((c) => c.number).filter((n) => typeof n === "number" && n > 0);
  if (chapNumbers.length === 0) return null;

  const minCh = Math.min(...chapNumbers);
  const maxCh = Math.max(...chapNumbers);

  // Find all arcs that fall within or intersect with [minCh, maxCh]
  const relevantArcs = BKP_CANON_ARCS.filter((a) => a.from <= maxCh && a.to >= minCh);
  if (relevantArcs.length <= 1) return null;

  const partitioned: Array<{ title: string; chapters: any[] }> = [];

  relevantArcs.forEach((arc) => {
    const arcChaps = chapters.filter((c) => c.number >= arc.from && c.number <= arc.to);
    if (arcChaps.length > 0) {
      partitioned.push({
        title: arc.title,
        chapters: arcChaps,
      });
    }
  });

  // Check if any chapters were left unassigned (e.g. at the edges)
  const assignedSet = new Set(partitioned.flatMap((p) => p.chapters));
  const unassigned = chapters.filter((c) => !assignedSet.has(c));

  if (unassigned.length > 0) {
    // If some unassigned chapters exist, attach them or create additional section
    const unMin = Math.min(...unassigned.map((c) => c.number));
    const unMax = Math.max(...unassigned.map((c) => c.number));
    partitioned.push({
      title: `(${unMin}-${unMax})`,
      chapters: unassigned,
    });
  }

  return partitioned.length > 1 ? partitioned : null;
}
