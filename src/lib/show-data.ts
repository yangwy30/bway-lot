export interface Show {
  id: string;
  site: 'BroadwayDirect'|'LuckySeat'|'Telecharge';
  title: string;
  price?: string;
  link: string;
  image?: string;
  city?: string;
  performances?: Array<{
    date: string;
    eventId?: string;
  }>;
}

export const MOCK_SHOWS: Show[] = [
  // BroadwayDirect
  {
    id: 'bd-six',
    site: 'BroadwayDirect',
    title: 'SIX (NY)',
    price: '$30.00',
    link: 'https://lottery.broadwaydirect.com/show/six-ny/',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/134931-3.jpg',
  },
  {
    id: 'bd-1',
    site: 'BroadwayDirect',
    title: 'ALADDIN',
    price: '$35.00',
    link: 'https://lottery.broadwaydirect.com/show/aladdin/',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/135824-5.jpg',
  },
  {
    id: 'bd-2',
    site: 'BroadwayDirect',
    title: 'DEATH BECOMES HER',
    price: '$45.00',
    link: 'https://lottery.broadwaydirect.com/show/dbh-nyc/',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/138691-3.jpg',
  },
  {
    id: 'bd-3',
    site: 'BroadwayDirect',
    title: 'MJ (NY)',
    price: '$49.00',
    link: 'https://lottery.broadwaydirect.com/show/mj-ny/',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/136006-3.jpg',
  },
  {
    id: 'bd-4',
    site: 'BroadwayDirect',
    title: 'WICKED',
    price: '$50.00',
    link: 'https://lottery.broadwaydirect.com/show/wicked/',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/136293-7.jpg',
  },
  {
    id: 'bd-5',
    site: 'BroadwayDirect',
    title: 'HAMILTON',
    price: '$10.00',
    link: 'https://lottery.broadwaydirect.com/show/hamilton/',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/138369-3.jpg',
  },
  {
    id: 'bd-6',
    site: 'BroadwayDirect',
    title: 'THE LION KING',
    price: '$35.00',
    link: 'https://lottery.broadwaydirect.com/show/the-lion-king/',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/135756-5.jpg',
  },
  // LuckySeat
  {
    id: 'ls-1',
    site: 'LuckySeat',
    title: 'The Outsiders',
    city: 'New York',
    price: '$47.00',
    link: 'https://www.luckyseat.com/shows/theoutsiders-newyork',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/127494-7.jpg',
  },
  {
    id: 'ls-2',
    site: 'LuckySeat',
    title: 'Hadestown',
    city: 'New York',
    price: '$49.00',
    link: 'https://www.luckyseat.com/shows/hadestown-newyork',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/133959-3.jpg',
  },
  {
    id: 'ls-3',
    site: 'LuckySeat',
    title: 'The Book of Mormon',
    city: 'New York',
    price: '$49.00',
    link: 'https://www.luckyseat.com/shows/thebookofmormon-newyork',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/138478-3.jpg',
  },
  {
    id: 'ls-4',
    site: 'LuckySeat',
    title: 'Moulin Rouge! The Musical',
    city: 'New York',
    price: '$49.00',
    link: 'https://www.luckyseat.com/shows/moulinrouge-newyork',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/126327-9.jpg',
  },
  {
    id: 'ls-5',
    site: 'LuckySeat',
    title: 'Every Brilliant Thing',
    city: 'New York',
    price: '$45.00',
    link: 'https://www.luckyseat.com/shows/everybrilliantthing-newyork',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/137299-5.jpg',
  },
  // Telecharge
  {
    id: 'tc-1',
    site: 'Telecharge',
    title: "Buena Vista Social Club",
    link: 'https://rush.telecharge.com/',
    price: '$49.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/136504-3.jpg',
  },
  {
    id: 'tc-2',
    site: 'Telecharge',
    title: "Operation Mincemeat",
    link: 'https://rush.telecharge.com/',
    price: '$49.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/132657-3.jpg',
  },
  {
    id: 'tc-3',
    site: 'Telecharge',
    title: "Ragtime",
    link: 'https://rush.telecharge.com/',
    price: '$49.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/136295-3.png',
  },
  {
    id: 'tc-4',
    site: 'Telecharge',
    title: "Stranger Things: The First Shadow",
    link: 'https://rush.telecharge.com/',
    price: '$45.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/139366-3.jpg',
  },
  {
    id: 'tc-5',
    site: 'Telecharge',
    title: "Jamie Allan's Amaze",
    link: 'https://rush.telecharge.com/',
    price: '$45.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/135399-3.jpg',
    performances: [
      { date: 'Sunday, March 22, 2026 at 12:00PM', eventId: '43000' },
      { date: 'Sunday, March 22, 2026 at 3:00PM', eventId: '42991' }
    ]
  },
  {
    id: 'tc-6',
    site: 'Telecharge',
    title: "Maybe Happy Ending",
    link: 'https://rush.telecharge.com/',
    price: '$49.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/139195-3.jpg',
    performances: [
      { date: 'Sunday, March 22, 2026 at 2:00PM', eventId: '42978' }
    ]
  }
];
