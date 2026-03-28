export type Category =
  | 'Clothing & Accessories'
  | 'Books & Media'
  | 'Toys & Games'
  | 'Sports & Outdoors'
  | 'Home & Garden'
  | 'Art & Crafts'
  | 'Music & Instruments'
  | 'Food & Drinks'
  | 'Collectibles'
  | 'Furniture'
  | 'Tools'
  | 'Baby & Kids'
  | 'Plants & Garden'
  | 'Experiences & Services'
  | 'Vehicles & Transport'
  | 'Pet Supplies'
  | 'Spiritual & Esoteric'
  | 'Other'

export const CATEGORIES: Category[] = [
  'Clothing & Accessories',
  'Books & Media',
  'Toys & Games',
  'Sports & Outdoors',
  'Home & Garden',
  'Art & Crafts',
  'Music & Instruments',
  'Food & Drinks',
  'Collectibles',
  'Furniture',
  'Tools',
  'Baby & Kids',
  'Plants & Garden',
  'Experiences & Services',
  'Vehicles & Transport',
  'Pet Supplies',
  'Spiritual & Esoteric',
  'Other',
]

export const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
  'Bangladesh', 'Belgium', 'Bolivia', 'Brazil', 'Bulgaria', 'Cambodia',
  'Canada', 'Chile', 'China', 'Colombia', 'Croatia', 'Czech Republic',
  'Denmark', 'Ecuador', 'Egypt', 'Ethiopia', 'Finland', 'France',
  'Germany', 'Ghana', 'Greece', 'Guatemala', 'Hungary', 'India',
  'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica',
  'Japan', 'Jordan', 'Kenya', 'Malaysia', 'Mexico', 'Morocco',
  'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan',
  'Peru', 'Philippines', 'Poland', 'Portugal', 'Romania', 'Russia',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Singapore', 'South Africa',
  'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland',
  'Tanzania', 'Thailand', 'Turkey', 'Uganda', 'Ukraine',
  'United Kingdom', 'United States', 'Venezuela', 'Vietnam', 'Zimbabwe',
]

export type SwapStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'a_shipped'
  | 'b_shipped'
  | 'both_shipped'
  | 'a_received'
  | 'b_received'
  | 'completed'
  | 'disputed'

export interface Profile {
  id: string
  username: string | null
  bio: string | null
  avatar_url: string | null
  country: string
  trust_score: number
  total_ratings: number
  completed_swaps: number
  created_at: string
}

export interface Item {
  id: string
  user_id: string
  title: string
  description: string
  category: Category
  images: string[]
  country: string
  status: 'available' | 'in_swap' | 'swapped'
  created_at: string
  profiles?: Profile
}

export interface Swap {
  id: string
  requester_id: string
  receiver_id: string
  requester_item_id: string
  receiver_item_id: string
  status: SwapStatus
  created_at: string
  updated_at: string
  requester?: Profile
  receiver?: Profile
  requester_item?: Item
  receiver_item?: Item
}

export interface Message {
  id: string
  swap_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: Profile
}

export interface Rating {
  id: string
  swap_id: string
  rater_id: string
  rated_id: string
  score: number
  comment: string | null
  created_at: string
}
