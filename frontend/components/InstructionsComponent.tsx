import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ecircle from "@/public/grid-images/enemies/e-circle.png";
import ecross from "@/public/grid-images/enemies/e-cross.png";
import ediamond from "@/public/grid-images/enemies/e-diamond.png";
import ehexagon from "@/public/grid-images/enemies/e-hexagon.png";
import esemicircle from "@/public/grid-images/enemies/e-semicircle.png";
import esquare from "@/public/grid-images/enemies/e-square.png";
import estar from "@/public/grid-images/enemies/e-star.png";
import etriangle from "@/public/grid-images/enemies/e-triangle.png";
import Image from "next/image";

const enemyImages = [
  { src: ecircle, alt: "Circle Enemy" },
  { src: ecross, alt: "Cross Enemy" },
  { src: ediamond, alt: "Diamond Enemy" },
  { src: ehexagon, alt: "Hexagon Enemy" },
  { src: esemicircle, alt: "Semicircle Enemy" },
  { src: esquare, alt: "Square Enemy" },
  { src: estar, alt: "Star Enemy" },
  { src: etriangle, alt: "Triangle Enemy" },
];

const InstructionsComponent = () => {
  return (
    <div className="mt-12 md:max-w-screen-sm w-full">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger className="justify-center gap-4 text-xl">
            Instructions
          </AccordionTrigger>
          <AccordionContent>
            <ol className="list-inside list-decimal font-normal">
              <li>
                Hidden bugs are scattered across the grid
                <div className="flex gap-2 mb-2">
                  {enemyImages.map((image, index) => (
                    <Image
                      key={index}
                      src={image.src}
                      alt={image.alt}
                      width={25}
                      height={25}
                    />
                  ))}
                </div>
              </li>
              <li>
                You have <span className="text-[#5cffb1]">35 seconds</span> to
                find them by hovering over the shapes
              </li>
              <li>
                Mark potential bug locations by{" "}
                <span className="text-[#5cffb1]">clicking</span> the grid cells
              </li>
              <li>
                Click{" "}
                <span className="text-[#5cffb1]">&quot;Verify Guess&quot;</span>{" "}
                or wait for timer to end
              </li>
              <li>Wait for the result and proceed to the next block!</li>
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default InstructionsComponent;
