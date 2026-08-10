import { GROUP_01_QUESTIONS } from "./question-groups/group-01.js";
import { GROUP_02_QUESTIONS } from "./question-groups/group-02.js";
import { GROUP_03_QUESTIONS } from "./question-groups/group-03.js";
import { GROUP_04_QUESTIONS } from "./question-groups/group-04.js";
import { GROUP_05_QUESTIONS } from "./question-groups/group-05.js";
import { GROUP_06_QUESTIONS } from "./question-groups/group-06.js";
import { GROUP_07_QUESTIONS } from "./question-groups/group-07.js";
import { GROUP_08_QUESTIONS } from "./question-groups/group-08.js";
import { GROUP_09_QUESTIONS } from "./question-groups/group-09.js";
import { GROUP_10_QUESTIONS } from "./question-groups/group-10.js";

export const QUESTION_GROUPS = [
  { id: "group-01", range: "01–10", label: "基本の10問" },
  { id: "group-02", range: "11–20", label: "見取り・評価" },
  { id: "group-03", range: "21–30", label: "個別と協働" },
  { id: "group-04", range: "31–40", label: "問い・探究" },
  { id: "group-05", range: "41–50", label: "授業設計" },
  { id: "group-06", range: "51–60", label: "校内研究" },
  { id: "group-07", range: "61–70", label: "教育課程" },
  { id: "group-08", range: "71–80", label: "ICT・生成AI" },
  { id: "group-09", range: "81–90", label: "学校づくり" },
  { id: "group-10", range: "91–100", label: "多様な学び" },
];

export const QUESTIONS = [
  ...GROUP_01_QUESTIONS,
  ...GROUP_02_QUESTIONS,
  ...GROUP_03_QUESTIONS,
  ...GROUP_04_QUESTIONS,
  ...GROUP_05_QUESTIONS,
  ...GROUP_06_QUESTIONS,
  ...GROUP_07_QUESTIONS,
  ...GROUP_08_QUESTIONS,
  ...GROUP_09_QUESTIONS,
  ...GROUP_10_QUESTIONS,
];
