/* ==========================================================================
   HTMLVault — Course configuration
   The ONLY place course data lives. Homepage, course detail page, checkout,
   My Courses, and the lesson guard all read from this file. To add a new
   course: add one object here (and drop its lesson file in /lessons) —
   nothing else in the project needs to change.

   Field reference:
     id            unique slug, used in ?id= URLs and purchase records
     title         full course title
     shortDesc     one-line description for course cards
     description   longer description for the course detail page
     subject       subject label shown on cards ("Toán" / "Tiếng Anh")
     level         grade/level label ("Lớp 3")
     accentColor   hex used for the card's signature accent glow
     accentDeep    darker shade of accentColor, used for the subject label
     thumbnail     path to the course thumbnail, relative to project root
     isFree        true/false
     price         price in VND (ignored when isFree is true)
     highlights    short bullet list shown on the buy card
     lessonPath    path to the lesson HTML file, relative to project root
   ========================================================================== */
(function (window) {
  'use strict';

  var HV = window.HV = window.HV || {};

  var COURSES = [
    {
      id: 'toan-lop-3',
      title: 'Toán Lớp 3 – Kết Nối Tri Thức Với Cuộc Sống',
      shortDesc: 'Luyện tập toán theo chương trình sách giáo khoa lớp 3 mới, bám sát 9 chương học trên lớp.',
      description: 'Ôn tập toàn diện chương trình Toán lớp 3 theo bộ sách "Kết Nối Tri Thức Với Cuộc Sống". Học sinh chọn chương, chọn cấp độ (dễ / trung bình / khó) và luyện tập với phản hồi tức thì cho từng câu hỏi.',
      subject: 'Toán',
      level: 'Lớp 3',
      accentColor: '#1565C0',
      accentDeep: '#0D47A1',
      thumbnail: 'assets/images/toan-lop-3.svg',
      isFree: true,
      price: 0,
      highlights: [
        '9 chương bám sát sách giáo khoa',
        '3 cấp độ: Dễ / Trung bình / Khó',
        'Theo dõi điểm đúng, sai và chuỗi thắng'
      ],
      lessonPath: 'lessons/TOAN_3_final_3_.html'
    },
    {
      id: 'vui-hoc-toan-3',
      title: 'Vui Học Toán 3 — Đấu Trường Trí Tuệ',
      shortDesc: 'Thi đấu toán học theo phong cách VioEdu — chọn vòng thi, chinh phục từng cấp độ khó.',
      description: 'Một sân đấu trí tuệ dành cho học sinh lớp 3: mỗi vòng thi gồm 30 câu hỏi, có tính giờ, streak thưởng và huy chương cuối vòng. Phong cách thi đấu giúp học sinh làm quen với áp lực thời gian một cách vui vẻ.',
      subject: 'Toán',
      level: 'Lớp 3',
      accentColor: '#FFB627',
      accentDeep: '#B8790C',
      thumbnail: 'assets/images/vui-hoc-toan-3.svg',
      isFree: false,
      price: 199000,
      highlights: [
        'Thi đấu theo vòng, 30 câu/vòng, có tính giờ',
        'Hiệu ứng streak, huy chương, pháo giấy khi hoàn thành',
        '3 mức độ khó cho mỗi vòng thi'
      ],
      lessonPath: 'lessons/VIOEDU_TOAN_3.html'
    },
    {
      id: 'dau-truong-anh-ngu-3',
      title: 'Đấu Trường Anh Ngữ — Lớp 3',
      shortDesc: 'Chinh phục mạo từ a / an / the qua các vòng đấu vui nhộn, có chế độ thường và chế độ khó.',
      description: 'Luyện tập mạo từ tiếng Anh (a / an / the) qua các vòng đấu theo phong cách gameshow. Có chế độ Thường và chế độ Khó với chủ đề mở rộng, cùng hệ thống huy chương và hiệu ứng động viên sau mỗi câu trả lời.',
      subject: 'Tiếng Anh',
      level: 'Lớp 3',
      accentColor: '#F2994A',
      accentDeep: '#D97A2B',
      thumbnail: 'assets/images/dau-truong-anh-ngu-3.svg',
      isFree: false,
      price: 149000,
      highlights: [
        'Luyện mạo từ a / an / the theo từng vòng',
        'Chế độ Thường và chế độ Khó',
        'Huy chương và hiệu ứng động viên sau mỗi câu'
      ],
      lessonPath: 'lessons/TIENG_ANH_3_v11_mao_tu.html'
    }
  ];

  /** Looks up a single course by id. Returns null if not found. */
  function getCourse(id) {
    for (var i = 0; i < COURSES.length; i++) {
      if (COURSES[i].id === id) return COURSES[i];
    }
    return null;
  }

  HV.COURSES = COURSES;
  HV.getCourse = getCourse;
})(typeof window !== 'undefined' ? window : globalThis);
