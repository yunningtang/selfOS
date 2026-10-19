/** A compact gazetteer for the birth-place picker. Coordinates in decimal degrees; zones are IANA names. */
export interface City {
  name: string
  en: string
  lat: number
  lon: number
  tz: string
}

export const CITIES: City[] = [
  { name: '北京', en: 'Beijing', lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai' },
  { name: '上海', en: 'Shanghai', lat: 31.2304, lon: 121.4737, tz: 'Asia/Shanghai' },
  { name: '广州', en: 'Guangzhou', lat: 23.1291, lon: 113.2644, tz: 'Asia/Shanghai' },
  { name: '深圳', en: 'Shenzhen', lat: 22.5431, lon: 114.0579, tz: 'Asia/Shanghai' },
  { name: '成都', en: 'Chengdu', lat: 30.5728, lon: 104.0668, tz: 'Asia/Shanghai' },
  { name: '重庆', en: 'Chongqing', lat: 29.5630, lon: 106.5516, tz: 'Asia/Shanghai' },
  { name: '杭州', en: 'Hangzhou', lat: 30.2741, lon: 120.1551, tz: 'Asia/Shanghai' },
  { name: '南京', en: 'Nanjing', lat: 32.0603, lon: 118.7969, tz: 'Asia/Shanghai' },
  { name: '武汉', en: 'Wuhan', lat: 30.5928, lon: 114.3055, tz: 'Asia/Shanghai' },
  { name: '西安', en: "Xi'an", lat: 34.3416, lon: 108.9398, tz: 'Asia/Shanghai' },
  { name: '天津', en: 'Tianjin', lat: 39.3434, lon: 117.3616, tz: 'Asia/Shanghai' },
  { name: '苏州', en: 'Suzhou', lat: 31.2989, lon: 120.5853, tz: 'Asia/Shanghai' },
  { name: '长沙', en: 'Changsha', lat: 28.2282, lon: 112.9388, tz: 'Asia/Shanghai' },
  { name: '郑州', en: 'Zhengzhou', lat: 34.7466, lon: 113.6254, tz: 'Asia/Shanghai' },
  { name: '济南', en: 'Jinan', lat: 36.6512, lon: 117.1201, tz: 'Asia/Shanghai' },
  { name: '青岛', en: 'Qingdao', lat: 36.0671, lon: 120.3826, tz: 'Asia/Shanghai' },
  { name: '沈阳', en: 'Shenyang', lat: 41.8057, lon: 123.4315, tz: 'Asia/Shanghai' },
  { name: '大连', en: 'Dalian', lat: 38.9140, lon: 121.6147, tz: 'Asia/Shanghai' },
  { name: '哈尔滨', en: 'Harbin', lat: 45.8038, lon: 126.5350, tz: 'Asia/Shanghai' },
  { name: '长春', en: 'Changchun', lat: 43.8171, lon: 125.3235, tz: 'Asia/Shanghai' },
  { name: '石家庄', en: 'Shijiazhuang', lat: 38.0428, lon: 114.5149, tz: 'Asia/Shanghai' },
  { name: '太原', en: 'Taiyuan', lat: 37.8706, lon: 112.5489, tz: 'Asia/Shanghai' },
  { name: '合肥', en: 'Hefei', lat: 31.8206, lon: 117.2272, tz: 'Asia/Shanghai' },
  { name: '福州', en: 'Fuzhou', lat: 26.0745, lon: 119.2965, tz: 'Asia/Shanghai' },
  { name: '厦门', en: 'Xiamen', lat: 24.4798, lon: 118.0894, tz: 'Asia/Shanghai' },
  { name: '南昌', en: 'Nanchang', lat: 28.6820, lon: 115.8579, tz: 'Asia/Shanghai' },
  { name: '南宁', en: 'Nanning', lat: 22.8170, lon: 108.3665, tz: 'Asia/Shanghai' },
  { name: '昆明', en: 'Kunming', lat: 25.0389, lon: 102.7183, tz: 'Asia/Shanghai' },
  { name: '贵阳', en: 'Guiyang', lat: 26.6477, lon: 106.6302, tz: 'Asia/Shanghai' },
  { name: '兰州', en: 'Lanzhou', lat: 36.0611, lon: 103.8343, tz: 'Asia/Shanghai' },
  { name: '西宁', en: 'Xining', lat: 36.6171, lon: 101.7782, tz: 'Asia/Shanghai' },
  { name: '银川', en: 'Yinchuan', lat: 38.4872, lon: 106.2309, tz: 'Asia/Shanghai' },
  { name: '呼和浩特', en: 'Hohhot', lat: 40.8424, lon: 111.7490, tz: 'Asia/Shanghai' },
  { name: '乌鲁木齐', en: 'Ürümqi', lat: 43.8256, lon: 87.6168, tz: 'Asia/Shanghai' },
  { name: '拉萨', en: 'Lhasa', lat: 29.6520, lon: 91.1721, tz: 'Asia/Shanghai' },
  { name: '海口', en: 'Haikou', lat: 20.0444, lon: 110.1999, tz: 'Asia/Shanghai' },
  { name: '香港', en: 'Hong Kong', lat: 22.3193, lon: 114.1694, tz: 'Asia/Hong_Kong' },
  { name: '澳门', en: 'Macau', lat: 22.1987, lon: 113.5439, tz: 'Asia/Macau' },
  { name: '台北', en: 'Taipei', lat: 25.0330, lon: 121.5654, tz: 'Asia/Taipei' },
  { name: '东京', en: 'Tokyo', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo' },
  { name: '首尔', en: 'Seoul', lat: 37.5665, lon: 126.9780, tz: 'Asia/Seoul' },
  { name: '新加坡', en: 'Singapore', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore' },
  { name: '吉隆坡', en: 'Kuala Lumpur', lat: 3.1390, lon: 101.6869, tz: 'Asia/Kuala_Lumpur' },
  { name: '曼谷', en: 'Bangkok', lat: 13.7563, lon: 100.5018, tz: 'Asia/Bangkok' },
  { name: '新德里', en: 'New Delhi', lat: 28.6139, lon: 77.2090, tz: 'Asia/Kolkata' },
  { name: '孟买', en: 'Mumbai', lat: 19.0760, lon: 72.8777, tz: 'Asia/Kolkata' },
  { name: '迪拜', en: 'Dubai', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  { name: '莫斯科', en: 'Moscow', lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow' },
  { name: '伦敦', en: 'London', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  { name: '巴黎', en: 'Paris', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris' },
  { name: '柏林', en: 'Berlin', lat: 52.5200, lon: 13.4050, tz: 'Europe/Berlin' },
  { name: '罗马', en: 'Rome', lat: 41.9028, lon: 12.4964, tz: 'Europe/Rome' },
  { name: '马德里', en: 'Madrid', lat: 40.4168, lon: -3.7038, tz: 'Europe/Madrid' },
  { name: '纽约', en: 'New York', lat: 40.7128, lon: -74.0060, tz: 'America/New_York' },
  { name: '洛杉矶', en: 'Los Angeles', lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' },
  { name: '旧金山', en: 'San Francisco', lat: 37.7749, lon: -122.4194, tz: 'America/Los_Angeles' },
  { name: '芝加哥', en: 'Chicago', lat: 41.8781, lon: -87.6298, tz: 'America/Chicago' },
  { name: '多伦多', en: 'Toronto', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
  { name: '温哥华', en: 'Vancouver', lat: 49.2827, lon: -123.1207, tz: 'America/Vancouver' },
  { name: '墨西哥城', en: 'Mexico City', lat: 19.4326, lon: -99.1332, tz: 'America/Mexico_City' },
  { name: '圣保罗', en: 'São Paulo', lat: -23.5505, lon: -46.6333, tz: 'America/Sao_Paulo' },
  { name: '悉尼', en: 'Sydney', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
  { name: '墨尔本', en: 'Melbourne', lat: -37.8136, lon: 144.9631, tz: 'Australia/Melbourne' },
  { name: '奥克兰', en: 'Auckland', lat: -36.8509, lon: 174.7645, tz: 'Pacific/Auckland' },
  { name: '开罗', en: 'Cairo', lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo' },
  { name: '约翰内斯堡', en: 'Johannesburg', lat: -26.2041, lon: 28.0473, tz: 'Africa/Johannesburg' },
]

export function listTimeZones(): string[] {
  try {
    return (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone') ?? []
  } catch {
    return []
  }
}
