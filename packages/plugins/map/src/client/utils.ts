export const getCurrentPosition: () => Promise<{ lat: number; lng: number }> = () => {
  return new Promise((resolve, reject) => {
    const defaultLatLng = () => {
      // google company lat and lng
      resolve({ lat: 37.4224764, lng: -122.0842499 });
    };
    // 获取当前位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({ lat: latitude, lng: longitude });
        },
        () => {
          defaultLatLng();
        },
      );
    } else {
      defaultLatLng();
    }
  });
};
