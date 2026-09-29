// Portfolio content. Edit this file to add projects or update details.
export const PROFILE = {
  name: 'Abdullah Al Abrar',
  nickname: 'Zohan',
  title: 'Architect & Visualizer',
  studio: 'A. Conception',
  email: 'johanabrar5@gmail.com',
  phone: '+880 18503 55772',
  behance: 'https://www.behance.net/johanabrar',
  website: 'https://johanabrar5.wixsite.com/aconception',
  location: 'Bashundhara R/A, Dhaka, Bangladesh',
  cv: 'assets/cv/Abdullah-Al-Abrar-CV.pdf',
  intro: 'I design buildings and then bring them to life: photoreal renders, walkthrough films and interiors that let clients feel a space before it exists.',
  experience: [
    { role: '3D Artist & Visualizer', org: 'Trimatrik Studio', when: 'Oct 2025 – Present' },
    { role: 'Assistant Architect', org: 'South Heaven Architects Ltd.', when: 'Aug 2024 – Sep 2025' },
    { role: 'Brand Executive & Visualizer', org: 'Dhaka Street Restaurant', when: 'Apr 2023 – Feb 2024' },
    { role: 'Visualizer', org: 'SEBL DX Group', when: 'Aug 2022 – Dec 2023' },
    { role: 'Social Designer', org: 'Chamak Restaurant', when: 'Feb 2021 – Dec 2021' },
    { role: 'Intern Graphic Designer', org: 'Changetech BD', when: 'Sep 2020 – Nov 2020' },
  ],
  education: [
    { what: 'Bachelor of Architecture', where: 'American International University-Bangladesh, Dhaka' },
    { what: 'HSC 2018', where: 'South Asian College, Chittagong' },
    { what: 'SSC 2016', where: 'Shah Wali Ullah Institute, Chittagong' },
  ],
  skills: ['AutoCAD', 'SketchUp', 'D5 Render', 'Blender', 'MetaHuman', 'Photoshop', 'Illustrator', 'Premiere Pro', 'After Effects'],
  hobbies: ['Art', 'Photography', 'Cinematography', 'Gaming'],
};

// Project titles below are placeholders written from the render frames;
// rename them and add more entries (images go in assets/work/).
export const PROJECTS = [
  {
    id: 'film',
    title: 'Residential walkthrough',
    kind: 'Animation · 33 s',
    cover: 'assets/work/poster.jpg',
    video: 'assets/work/building-render.mp4',
    blurb: 'A cinematic walkthrough: exterior at dusk, amenities, interiors and arrival sequence.',
    images: [],
  },
  {
    id: 'tower',
    title: 'High-rise residence',
    kind: 'Exterior visualization',
    cover: 'assets/work/thumb-17.jpg',
    blurb: 'Tower massing and street-level context in soft overcast light.',
    images: ['assets/work/still-17.jpg', 'assets/work/still-2.jpg'],
  },
  {
    id: 'pool',
    title: 'Rooftop pool deck',
    kind: 'Amenity visualization',
    cover: 'assets/work/thumb-22.jpg',
    blurb: 'Sky-level infinity pool framed by a concrete portal, looking over the city.',
    images: ['assets/work/still-22.jpg'],
  },
  {
    id: 'interior',
    title: 'Dining & living interior',
    kind: 'Interior visualization',
    cover: 'assets/work/thumb-12.jpg',
    blurb: 'Warm pendant light, dark timber and marble, with detail down to the fruit bowl.',
    images: ['assets/work/still-12.jpg', 'assets/work/still-7.jpg'],
  },
  {
    id: 'arrival',
    title: 'Entrance court & porch',
    kind: 'Exterior visualization',
    cover: 'assets/work/thumb-27.jpg',
    blurb: 'Screened timber gates, hanging greens and a double-height car porch.',
    images: ['assets/work/still-27.jpg', 'assets/work/still-31.jpg'],
  },
];
