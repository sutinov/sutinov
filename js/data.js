/* ==========================================================================
   CV content â€” edit this file to update the website.
   ========================================================================== */
window.CV = {
  profile: {
    name: 'Blagoj Sutinov',
    role: 'Software Developer \u00b7 Java & Angular',
    // Shown in the mock browser bar on the 3D plan (no protocol).
    site: 'sutinov.github.io',
    email: 'bsutinov@gmail.com',
    phone: '+389 75 294 137',
    phoneHref: 'tel:+38975294137',
    location: 'Veles, North Macedonia',
    linkedin: 'https://www.linkedin.com/in/blagoj-sutinov/',
    cvFile: 'assets/Blagoj-Sutinov-CV.pdf',
    intro:
      'Software Developer with 4+ years of experience engineering enterprise-scale web applications with Java, Spring Boot, Angular and Azure.',
    bio:
      'Proven track record in microservices architecture, REST/SOAP system integrations and cloud migration initiatives in Agile/Scrum environments. Strong analytical background in translating complex business logic into high-performance, maintainable software.',
    facts: [
      { k: 'DISCIPLINE', v: 'Java / Full-Stack' },
      { k: 'BASED IN', v: 'Veles, North Macedonia' },
      { k: 'SOFTWARE SINCE', v: '2021 \u00b7 4+ years' },
      { k: 'EDUCATION', v: 'MA \u00b7 BA, Univ. of Veliko Tarnovo' }
    ],
    languages: [
      'Macedonian \u2014 Native',
      'English \u2014 Fluent / Bilingual',
      'Bulgarian \u2014 Fluent',
      'Serbian \u2014 Fluent'
    ]
  },

  experience: [
    {
      role: 'Software Developer',
      company: 'Open GI',
      dates: 'APR 2022 \u2014 JUN 2026 \u00b7 SKOPJE',
      points: [
        'Developed and maintained enterprise-scale insurance applications powering major UK brands (GoSkippy, Premium Choice, Hughes Insurance, Aura Insurance).',
        'Designed and deployed backend microservices with Java and Spring Boot, integrating secure third-party payment gateways for real-time policy transactions.',
        'Authored complex validation rules (driving licence histories, age, date of birth, underwriting criteria) for high-accuracy policy quoting.',
        'Built responsive, multi-tier customer quote comparison journeys in Angular, streamlining policy selection.',
        'Redesigned core business logic and refactored legacy components to improve performance, maintainability and test coverage.',
        'Resolved 100+ critical client support tickets across frontend, backend, database and external APIs; fixed 300+ application defects.',
        'Engineered internal diagnostic tools, incl. a Session Viewer app that let cross-functional teams trace quote journeys and transaction states.',
        'Implemented bidirectional REST and legacy SOAP integrations across distributed microservices.',
        'Contributed to business-critical Azure cloud migrations with zero business disruption.',
        'Collaborated with BAs, QA engineers and product owners in 2-week Agile sprints.'
      ],
      tags: ['Java', 'Spring Boot', 'Angular', 'TypeScript', 'Microservices', 'REST', 'SOAP', 'Azure', 'Agile / Scrum']
    },
    {
      role: 'Frontend Developer (Intern)',
      company: 'Tech Up',
      dates: '2021 \u2014 2022 \u00b7 VELES',
      points: [
        'Built a responsive dental practice management web app with modern JavaScript/TypeScript and a component-based architecture.',
        'Developed patient record modules (CRUD, dynamic search, appointment booking) supporting 500+ patient profiles.',
        'Engineered automated invoice generation and billing interfaces, cutting manual admin time for clinic staff.',
        'Integrated components with RESTful APIs, with robust form validation and error handling.',
        'Optimized bundle size and asset loading for a ~25% faster initial page load.',
        'Took part in code reviews, bug fixing and feature testing.'
      ],
      tags: ['JavaScript', 'TypeScript', 'REST APIs', 'Form Validation', 'Performance', 'Code Review']
    },
    {
      role: 'Learner Mentor',
      company: 'SkillUp Academy',
      dates: '2021 \u2014 2026 \u00b7 VELES',
      points: [
        'Designed and delivered project-based curricula covering HTML, CSS and modern JavaScript fundamentals.',
        'Guided students through interactive coding projects, instilling clean coding habits and debugging practices.'
      ],
      tags: ['HTML', 'CSS', 'JavaScript', 'Mentoring', 'Curriculum Design']
    },
    {
      role: 'ESL Teacher',
      company: 'Primary School \u201cPanko Brashnarov\u201d',
      dates: '2009 \u2014 2022 \u00b7 VELES',
      points: [
        'Developed strong cross-functional communication, mentoring and organizational skills over a 13-year career, using digital tools and modern methodologies.'
      ],
      tags: ['Communication', 'Mentoring', 'Organization']
    }
  ],

  projects: [
    {
      name: 'Job Hunt Tracker',
      kind: 'FULL-STACK',
      desc:
        'Centralized career management platform for tracking application pipelines, interviews and notes. Angular SPA frontend backed by a secure Spring Boot REST API.',
      stack: ['Angular', 'TypeScript', 'Java', 'Spring Boot', 'REST API', 'PostgreSQL']
    },
    {
      name: 'Glowing Candles',
      kind: 'FULL-STACK',
      desc:
        'Inventory and production management application tailored for artisanal candle makers, built on a relational MySQL data model.',
      stack: ['Angular', 'TypeScript', 'Java', 'Spring Boot', 'MySQL']
    }
  ],

  education: {
    institution: 'University of Veliko Tarnovo \u201cSt. St. Cyril and Methodius\u201d',
    degrees: [
      { degree: "Master's Degree", field: 'Diplomacy & National Security' },
      { degree: "Bachelor's Degree", field: 'English Philology' }
    ],
    facts: [
      { k: 'CERT \u00b7 2025', v: 'JavaScript Foundations Professional Certificate \u2014 Mozilla' },
      { k: 'CERT \u00b7 2024', v: 'Developing Your Emotional Intelligence \u2014 LinkedIn Learning' },
      { k: 'INSTITUTION', v: 'University of Veliko Tarnovo' },
      { k: 'COUNTRY', v: 'Bulgaria' }
    ]
  },

  skills: [
    { name: 'Backend', items: ['Java', 'Spring Boot', 'Spring MVC', 'Hibernate', 'JPA', 'RESTful APIs', 'SOAP'] },
    { name: 'Frontend', items: ['Angular 11+', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3'] },
    { name: 'Cloud & DevOps', items: ['Microsoft Azure', 'Git', 'Maven', 'Gradle', 'SVN', 'Apache Tomcat', 'Selenium'] },
    { name: 'Methodologies', items: ['Microservices', 'OOP', 'Agile / Scrum', 'CI/CD', 'TDD', 'Clean Code'] },
    { name: 'Interests & Lab', items: ['IoT', 'Raspberry Pi Home Server', 'Linux Home Labs', 'Karate'] }
  ],

  // Zones on the 900 x 600 blueprint. rect = position on the plan, height = a|b|c.
  zones: [
    { key: 'about', title: 'About', short: 'ABOUT', abbr: 'ABOUT', label: 'ABOUT', tipTitle: 'About', tipSub: 'Profile, location, languages', rect: { x: 60, y: 132, w: 480, h: 176 }, height: 'c', introDelay: 0.2 },
    { key: 'experience', title: 'Experience', short: 'EXPERIENCE', abbr: 'EXP.', label: 'EXPERIENCE', tipTitle: 'Experience', tipSub: '4 roles \u00b7 2009 \u2014 2026', rect: { x: 556, y: 132, w: 284, h: 176 }, height: 'a', introDelay: 0.4 },
    { key: 'projects', title: 'Projects', short: 'PROJECTS', abbr: 'PROJ.', label: 'PROJECTS', tipTitle: 'Projects', tipSub: 'Full-stack side projects', rect: { x: 60, y: 324, w: 250, h: 120 }, height: 'b', introDelay: 0.6 },
    { key: 'education', title: 'Education', short: 'EDUCATION', abbr: 'EDU.', label: 'EDUCATION', tipTitle: 'Education', tipSub: 'MA, BA & certifications', rect: { x: 326, y: 324, w: 250, h: 120 }, height: 'c', introDelay: 0.75 },
    { key: 'skills', title: 'Skills', short: 'SKILLS', abbr: 'SKILLS', label: 'SKILLS', tipTitle: 'Skills', tipSub: 'Backend, frontend, cloud', rect: { x: 592, y: 324, w: 248, h: 120 }, height: 'a', introDelay: 0.9 },
    { key: 'contact', title: 'Contact', short: 'CONTACT', abbr: 'CONTACT', label: 'CONTACT', tipTitle: 'Contact', tipSub: 'Email, phone, LinkedIn', rect: { x: 60, y: 460, w: 780, h: 84 }, height: 'b', introDelay: 1.1 }
  ]
};
