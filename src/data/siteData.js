import design1 from '../assets/design1.jpg'
import design2 from '../assets/design2.jpg'
import design3 from '../assets/design3.jpg'
import design4 from '../assets/design4.png'
import design5 from '../assets/design5.jpg'
import design6 from '../assets/design6.jpg'
import tattoo1 from '../assets/Tattoo1.jpg'
import tattoo2 from '../assets/Tattoo2.jpg'
import tattoo3 from '../assets/Tattoo3.jpg'
import tattoo4 from '../assets/Tattoo4.jpg'

export const PORTFOLIO_ITEMS = [
  {
    id: 1,
    title: 'Mythic Eagle Portrait',
    category: 'Black & Grey',
    img: design1,
    description: 'A detailed eagle portrait framed by a bold Greek key border.',
  },
  {
    id: 2,
    title: 'Feathered Wing',
    category: 'Blackwork',
    img: design2,
    description: 'A flowing feather design shaped along the forearm with a geometric cuff.',
  },
  {
    id: 3,
    title: 'Born by the Moon',
    category: 'Minimalist',
    img: design3,
    description: 'A small crescent moon paired with curved lettering and clean linework.',
  },
  {
    id: 4,
    title: 'Samurai Portrait',
    category: 'Black & Grey',
    img: design4,
    description: 'A shaded warrior portrait with a traditional helmet and bold dark details.',
  },
  {
    id: 5,
    title: 'Tiger and Eagle Sleeve',
    category: 'Realism',
    img: design5,
    description: 'A tiger portrait above a detailed landscape with a soaring eagle.',
  },
  {
    id: 6,
    title: 'Color Rose',
    category: 'Color',
    img: design6,
    description: 'A vibrant red rose with flowing green leaves and stem.',
  },
]

export const FLASH_ITEMS = [
  {
    id: 'f1',
    title: 'Hannya & Peony',
    description: 'A bold Japanese mask framed by soft peonies and flowing leaves.',
    size: '15cm x 8cm',
    price: '₱4,500',
    available: true,
    img: tattoo1,
  },
  {
    id: 'f2',
    title: 'Dove of Faith',
    description: 'A soaring dove, radiant sunburst, and gothic cross in crisp blackwork.',
    size: '15cm x 8cm',
    price: '₱3,800',
    available: true,
    img: tattoo2,
  },
  {
    id: 'f3',
    title: 'Cosmic Character',
    description: 'A playful cartoon portrait with a spiked silhouette and sketch shading.',
    size: '12cm x 10cm',
    price: '₱5,200',
    available: false,
    img: tattoo3,
  },
  {
    id: 'f4',
    title: 'Blue Serpent Bloom',
    description: 'A vivid blue serpent winding through layered blossoms and leaves.',
    size: '18cm x 12cm',
    price: '₱6,500',
    available: true,
    img: tattoo4,
  },
]
