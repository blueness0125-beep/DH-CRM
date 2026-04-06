export type Occupation = {
  category: string
  name: string
  riskGrade: string
}

export const occupations: Occupation[] = [
  // 사무/관리직
  { category: "사무/관리직", name: "일반사무직", riskGrade: "1급" },
  { category: "사무/관리직", name: "회계사", riskGrade: "1급" },
  { category: "사무/관리직", name: "세무사", riskGrade: "1급" },
  { category: "사무/관리직", name: "변호사", riskGrade: "1급" },
  { category: "사무/관리직", name: "법무사", riskGrade: "1급" },
  { category: "사무/관리직", name: "행정공무원", riskGrade: "1급" },
  { category: "사무/관리직", name: "경영컨설턴트", riskGrade: "1급" },
  { category: "사무/관리직", name: "인사관리자", riskGrade: "1급" },
  { category: "사무/관리직", name: "비서", riskGrade: "1급" },
  { category: "사무/관리직", name: "통역사/번역가", riskGrade: "1급" },

  // 교육직
  { category: "교육직", name: "대학교수", riskGrade: "1급" },
  { category: "교육직", name: "중고등학교 교사", riskGrade: "1급" },
  { category: "교육직", name: "초등학교 교사", riskGrade: "1급" },
  { category: "교육직", name: "유치원 교사", riskGrade: "1급" },
  { category: "교육직", name: "학원강사", riskGrade: "1급" },
  { category: "교육직", name: "교육행정가", riskGrade: "1급" },
  { category: "교육직", name: "특수교육교사", riskGrade: "1급" },
  { category: "교육직", name: "체육교사", riskGrade: "2급" },

  // 의료/보건직
  { category: "의료/보건직", name: "의사(내과)", riskGrade: "1급" },
  { category: "의료/보건직", name: "의사(외과)", riskGrade: "2급" },
  { category: "의료/보건직", name: "치과의사", riskGrade: "1급" },
  { category: "의료/보건직", name: "한의사", riskGrade: "1급" },
  { category: "의료/보건직", name: "약사", riskGrade: "1급" },
  { category: "의료/보건직", name: "간호사", riskGrade: "2급" },
  { category: "의료/보건직", name: "물리치료사", riskGrade: "2급" },
  { category: "의료/보건직", name: "방사선사", riskGrade: "2급" },
  { category: "의료/보건직", name: "임상병리사", riskGrade: "1급" },
  { category: "의료/보건직", name: "수의사", riskGrade: "2급" },
  { category: "의료/보건직", name: "응급구조사", riskGrade: "2급" },

  // 금융/보험직
  { category: "금융/보험직", name: "은행원", riskGrade: "1급" },
  { category: "금융/보험직", name: "증권사직원", riskGrade: "1급" },
  { category: "금융/보험직", name: "보험설계사", riskGrade: "1급" },
  { category: "금융/보험직", name: "손해사정사", riskGrade: "1급" },
  { category: "금융/보험직", name: "보험계리사", riskGrade: "1급" },
  { category: "금융/보험직", name: "펀드매니저", riskGrade: "1급" },
  { category: "금융/보험직", name: "금융분석가", riskGrade: "1급" },
  { category: "금융/보험직", name: "대출상담사", riskGrade: "1급" },

  // IT/기술직
  { category: "IT/기술직", name: "소프트웨어개발자", riskGrade: "1급" },
  { category: "IT/기술직", name: "시스템엔지니어", riskGrade: "1급" },
  { category: "IT/기술직", name: "네트워크관리자", riskGrade: "1급" },
  { category: "IT/기술직", name: "데이터분석가", riskGrade: "1급" },
  { category: "IT/기술직", name: "웹디자이너", riskGrade: "1급" },
  { category: "IT/기술직", name: "정보보안전문가", riskGrade: "1급" },
  { category: "IT/기술직", name: "IT컨설턴트", riskGrade: "1급" },
  { category: "IT/기술직", name: "DBA", riskGrade: "1급" },

  // 판매/영업직
  { category: "판매/영업직", name: "영업사원(외근)", riskGrade: "2급" },
  { category: "판매/영업직", name: "영업사원(내근)", riskGrade: "1급" },
  { category: "판매/영업직", name: "부동산중개사", riskGrade: "1급" },
  { category: "판매/영업직", name: "자동차딜러", riskGrade: "1급" },
  { category: "판매/영업직", name: "백화점판매원", riskGrade: "1급" },
  { category: "판매/영업직", name: "텔레마케터", riskGrade: "1급" },
  { category: "판매/영업직", name: "온라인쇼핑몰운영자", riskGrade: "1급" },

  // 서비스직
  { category: "서비스직", name: "호텔리어", riskGrade: "1급" },
  { category: "서비스직", name: "항공승무원", riskGrade: "2급" },
  { category: "서비스직", name: "요리사", riskGrade: "2급" },
  { category: "서비스직", name: "미용사", riskGrade: "2급" },
  { category: "서비스직", name: "웨딩플래너", riskGrade: "1급" },
  { category: "서비스직", name: "여행가이드", riskGrade: "2급" },
  { category: "서비스직", name: "피부관리사", riskGrade: "1급" },
  { category: "서비스직", name: "바리스타", riskGrade: "1급" },
  { category: "서비스직", name: "식당종업원", riskGrade: "2급" },
  { category: "서비스직", name: "세탁업종사자", riskGrade: "2급" },

  // 예술/문화/방송직
  { category: "예술/문화/방송직", name: "디자이너(그래픽)", riskGrade: "1급" },
  { category: "예술/문화/방송직", name: "사진작가", riskGrade: "1급" },
  { category: "예술/문화/방송직", name: "작가/소설가", riskGrade: "1급" },
  { category: "예술/문화/방송직", name: "기자", riskGrade: "2급" },
  { category: "예술/문화/방송직", name: "PD/방송연출", riskGrade: "2급" },
  { category: "예술/문화/방송직", name: "연기자", riskGrade: "2급" },
  { category: "예술/문화/방송직", name: "음악가", riskGrade: "1급" },
  { category: "예술/문화/방송직", name: "영상편집자", riskGrade: "1급" },

  // 건설/건축직
  { category: "건설/건축직", name: "건축사", riskGrade: "1급" },
  { category: "건설/건축직", name: "토목기사", riskGrade: "2급" },
  { category: "건설/건축직", name: "건설현장감독", riskGrade: "2급" },
  { category: "건설/건축직", name: "인테리어디자이너", riskGrade: "1급" },
  { category: "건설/건축직", name: "배관공", riskGrade: "2급" },
  { category: "건설/건축직", name: "전기기사(건축)", riskGrade: "2급" },
  { category: "건설/건축직", name: "도배장판기사", riskGrade: "2급" },
  { category: "건설/건축직", name: "용접공", riskGrade: "3급" },
  { category: "건설/건축직", name: "철근공", riskGrade: "3급" },
  { category: "건설/건축직", name: "크레인운전원", riskGrade: "3급" },
  { category: "건설/건축직", name: "비계공", riskGrade: "3급" },
  { category: "건설/건축직", name: "미장공", riskGrade: "2급" },
  { category: "건설/건축직", name: "방수공", riskGrade: "2급" },
  { category: "건설/건축직", name: "목수", riskGrade: "2급" },

  // 제조/생산직
  { category: "제조/생산직", name: "생산관리자", riskGrade: "2급" },
  { category: "제조/생산직", name: "품질관리자", riskGrade: "1급" },
  { category: "제조/생산직", name: "기계조작원", riskGrade: "2급" },
  { category: "제조/생산직", name: "조립원", riskGrade: "2급" },
  { category: "제조/생산직", name: "식품가공원", riskGrade: "2급" },
  { category: "제조/생산직", name: "섬유기계조작원", riskGrade: "2급" },
  { category: "제조/생산직", name: "금속가공원", riskGrade: "3급" },
  { category: "제조/생산직", name: "화학공정원", riskGrade: "3급" },
  { category: "제조/생산직", name: "인쇄기조작원", riskGrade: "2급" },

  // 운수/물류직
  { category: "운수/물류직", name: "택시운전기사", riskGrade: "2급" },
  { category: "운수/물류직", name: "버스운전기사", riskGrade: "2급" },
  { category: "운수/물류직", name: "화물차운전기사", riskGrade: "2급" },
  { category: "운수/물류직", name: "택배기사", riskGrade: "2급" },
  { category: "운수/물류직", name: "대리운전기사", riskGrade: "2급" },
  { category: "운수/물류직", name: "지게차운전원", riskGrade: "2급" },
  { category: "운수/물류직", name: "물류센터근무자", riskGrade: "2급" },
  { category: "운수/물류직", name: "선박기관사", riskGrade: "3급" },
  { category: "운수/물류직", name: "항공기조종사", riskGrade: "2급" },
  { category: "운수/물류직", name: "선장/항해사", riskGrade: "3급" },
  { category: "운수/물류직", name: "철도기관사", riskGrade: "2급" },

  // 농림어업직
  { category: "농림어업직", name: "농업인(논농사)", riskGrade: "2급" },
  { category: "농림어업직", name: "농업인(밭농사)", riskGrade: "2급" },
  { category: "농림어업직", name: "축산업자", riskGrade: "2급" },
  { category: "농림어업직", name: "원예재배자", riskGrade: "2급" },
  { category: "농림어업직", name: "양식업자", riskGrade: "2급" },
  { category: "농림어업직", name: "어업인(연근해)", riskGrade: "3급" },
  { category: "농림어업직", name: "어업인(원양)", riskGrade: "3급" },
  { category: "농림어업직", name: "임업종사자", riskGrade: "3급" },
  { category: "농림어업직", name: "버섯재배자", riskGrade: "2급" },
  { category: "농림어업직", name: "양봉업자", riskGrade: "2급" },

  // 공공/국방직
  { category: "공공/국방직", name: "경찰관(내근)", riskGrade: "2급" },
  { category: "공공/국방직", name: "경찰관(외근)", riskGrade: "3급" },
  { category: "공공/국방직", name: "소방관", riskGrade: "3급" },
  { category: "공공/국방직", name: "교도관", riskGrade: "3급" },
  { category: "공공/국방직", name: "직업군인(장교)", riskGrade: "2급" },
  { category: "공공/국방직", name: "직업군인(부사관)", riskGrade: "3급" },
  { category: "공공/국방직", name: "해양경찰", riskGrade: "3급" },
  { category: "공공/국방직", name: "세관공무원", riskGrade: "1급" },
  { category: "공공/국방직", name: "우체국직원", riskGrade: "1급" },
  { category: "공공/국방직", name: "환경미화원", riskGrade: "2급" },

  // 자영업
  { category: "자영업", name: "편의점운영", riskGrade: "1급" },
  { category: "자영업", name: "음식점운영", riskGrade: "2급" },
  { category: "자영업", name: "카페운영", riskGrade: "1급" },
  { category: "자영업", name: "PC방운영", riskGrade: "1급" },
  { category: "자영업", name: "세차장운영", riskGrade: "2급" },
  { category: "자영업", name: "학원운영", riskGrade: "1급" },
  { category: "자영업", name: "부동산임대업", riskGrade: "1급" },
  { category: "자영업", name: "주유소운영", riskGrade: "2급" },
  { category: "자영업", name: "약국운영", riskGrade: "1급" },
  { category: "자영업", name: "노래방운영", riskGrade: "1급" },

  // 기술/정비직
  { category: "기술/정비직", name: "자동차정비사", riskGrade: "2급" },
  { category: "기술/정비직", name: "전기기사", riskGrade: "2급" },
  { category: "기술/정비직", name: "에어컨설치기사", riskGrade: "2급" },
  { category: "기술/정비직", name: "엘리베이터정비사", riskGrade: "2급" },
  { category: "기술/정비직", name: "보일러기사", riskGrade: "2급" },
  { category: "기술/정비직", name: "가전제품수리기사", riskGrade: "2급" },
  { category: "기술/정비직", name: "통신설비기사", riskGrade: "2급" },

  // 스포츠/레저직
  { category: "스포츠/레저직", name: "프로운동선수", riskGrade: "3급" },
  { category: "스포츠/레저직", name: "체육교관/트레이너", riskGrade: "2급" },
  { category: "스포츠/레저직", name: "골프캐디", riskGrade: "2급" },
  { category: "스포츠/레저직", name: "스키강사", riskGrade: "3급" },
  { category: "스포츠/레저직", name: "수영강사", riskGrade: "2급" },
  { category: "스포츠/레저직", name: "헬스트레이너", riskGrade: "2급" },
  { category: "스포츠/레저직", name: "요가강사", riskGrade: "1급" },
  { category: "스포츠/레저직", name: "필라테스강사", riskGrade: "1급" },
  { category: "스포츠/레저직", name: "등산가이드", riskGrade: "3급" },
  { category: "스포츠/레저직", name: "다이빙강사", riskGrade: "3급" },

  // 기타
  { category: "기타", name: "주부(전업)", riskGrade: "1급" },
  { category: "기타", name: "학생(대학생)", riskGrade: "1급" },
  { category: "기타", name: "학생(고등학생 이하)", riskGrade: "1급" },
  { category: "기타", name: "무직", riskGrade: "1급" },
  { category: "기타", name: "퇴직자/은퇴자", riskGrade: "1급" },
  { category: "기타", name: "프리랜서(사무)", riskGrade: "1급" },
  { category: "기타", name: "종교인(성직자)", riskGrade: "1급" },
  { category: "기타", name: "자원봉사자", riskGrade: "1급" },
]
