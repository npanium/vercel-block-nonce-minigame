interface SwishSpinnerProps {
  loading?: boolean;
  size?: number;
  frontColor?: string;
  backColor?: string;
  sizeUnit?: string;
}

const getBalls = ({
  countBallsInLine,
  frontColor,
  size,
  sizeUnit,
}: SwishSpinnerProps & { countBallsInLine: number }) => {
  const balls = [];
  let keyValue = 0;
  for (let i = 0; i < countBallsInLine; i++) {
    for (let j = 0; j < countBallsInLine; j++) {
      balls.push(
        <div
          className="ball"
          style={{
            backgroundColor: frontColor,
            width: `${size! / 5}${sizeUnit}`,
            height: `${size! / 5}${sizeUnit}`,
            top: `${j * (size! / 3 + size! / 15)}${sizeUnit}`,
            left: `${i * (size! / 3 + size! / 15)}${sizeUnit}`,
            animationDelay: `${keyValue * 0.1}s`,
          }}
          key={keyValue.toString()}
        ></div>
      );
      keyValue++;
    }
  }
  return balls;
};

export const SwishSpinner: React.FC<SwishSpinnerProps> = ({
  loading = true,
  size = 40,
  frontColor = "#5c39ff",
  backColor = "#5cffb1",
  sizeUnit = "px",
}) => {
  const countBallsInLine = 3;
  return (
    loading && (
      <div
        className="wrapper"
        style={
          {
            width: `${size}${sizeUnit}`,
            height: `${size}${sizeUnit}`,
            margin: "1rem auto",
            // Set CSS variable for the animation background colo
            "--backColor": backColor,
          } as React.CSSProperties
        }
      >
        {getBalls({
          countBallsInLine,
          frontColor,
          backColor,
          size,
          sizeUnit,
        })}
      </div>
    )
  );
};
