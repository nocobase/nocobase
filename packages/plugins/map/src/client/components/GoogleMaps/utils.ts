export const getIcon = (url) => {
  return {
    url,
    scaledSize: {
      width: 19,
      height: 32,
    },
    labelOrigin: new google.maps.Point(19 / 2, 32 + 10),
  } as google.maps.Icon;
};

export const getCurrentPosition: () => Promise<{ lat: number; lng: number }> = () => {
  return new Promise((resolve) => {
    const defaultLatLng = () => {
      // google company lat and lng
      resolve({ lat: 37.4224764, lng: -122.0842499 });
    };

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
