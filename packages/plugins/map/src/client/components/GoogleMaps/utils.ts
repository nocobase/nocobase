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
