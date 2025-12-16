import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GameLocation, WorldData } from '../types';
import { Plus, Minus } from 'lucide-react';

interface GlobeProps {
  locations: GameLocation[];
  selectedLocationId: string | null;
  onLocationSelect: (id: string | null) => void;
  viewCenter?: { lat: number, lng: number } | null;
}

const Globe: React.FC<GlobeProps> = ({ locations, selectedLocationId, onLocationSelect, viewCenter }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [worldData, setWorldData] = useState<WorldData | null>(null);
  
  const rotationRef = useRef<[number, number, number]>([0, 0, 0]);
  const transitionRef = useRef<d3.Transition<any, any, any, any> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);
  const selectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then(res => res.json())
      .then(data => setWorldData(data))
      .catch(err => console.error("Failed to load world data", err));
  }, []);

  useEffect(() => {
    if (!worldData || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const svg = d3.select(svgRef.current);
    selectionRef.current = svg;
    svg.selectAll("*").remove();

    // 8-bit blinking animation
    const defs = svg.append("defs");
    defs.append("style").text(`
      @keyframes blink {
        0% { opacity: 1; }
        50% { opacity: 0; }
        100% { opacity: 1; }
      }
    `);

    // Retro Palette
    const COLOR_WATER = "#000044"; // Deep retro blue
    const COLOR_LAND = "#00A800";   // Matrix green
    const COLOR_GRID = "#00FF00";   // Bright green
    const COLOR_MARKER = "#FFFF00"; // Yellow
    const COLOR_SELECTED = "#FF00FF"; // Magenta

    const waterGroup = svg.append("g").attr("class", "layer-water");
    const graticuleGroup = svg.append("g").attr("class", "layer-graticule");
    const landGroup = svg.append("g").attr("class", "layer-land");
    const markersGroup = svg.append("g").attr("class", "layer-markers");

    // 1. Water (Square background essentially)
    waterGroup.append("path")
      .datum({ type: "Sphere" })
      .attr("class", "water")
      .attr("fill", COLOR_WATER)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2);

    // 2. Graticule
    const graticule = d3.geoGraticule();
    graticuleGroup.append("path")
      .datum(graticule())
      .attr("class", "graticule")
      .attr("fill", "none")
      .attr("stroke", COLOR_GRID)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4") // Dashed lines for retro feel
      .attr("stroke-opacity", 0.3);

    // 3. Land
    landGroup.selectAll("path.land")
      .data(worldData.features)
      .enter()
      .append("path")
      .attr("class", "land")
      .attr("fill", COLOR_LAND)
      .attr("stroke", "#000") // Black borders between countries
      .attr("stroke-width", 1)
      .style("shape-rendering", "crispEdges"); // Disable anti-aliasing for jagged edges

    // PERSIST ZOOM: Check if the element already has a zoom transform applied
    const currentTransform = d3.zoomTransform(svgRef.current);
    const currentK = currentTransform.k || 1;

    const initialScale = Math.min(width, height) / 2.5;
    const projection = d3.geoOrthographic()
      .scale(initialScale * currentK) // Apply stored zoom
      .center([0, 0])
      .translate([width / 2, height / 2]);

    const pathGenerator = d3.geoPath().projection(projection);

    const draw = () => {
      projection.rotate(rotationRef.current);

      svg.selectAll("path.water").attr("d", pathGenerator as any);
      svg.selectAll("path.graticule").attr("d", pathGenerator as any);
      svg.selectAll("path.land").attr("d", pathGenerator as any);

      const markers = markersGroup.selectAll<SVGGElement, GameLocation>("g.marker").data(locations, (d) => d.id);
      
      markers.exit().remove();

      const markersEnter = markers.enter().append("g").attr("class", "marker");
      
      // Use RECT for pixels instead of circles
      // Selection Indicator (Big Box)
      markersEnter.append("rect")
        .attr("class", "selection-box")
        .attr("width", 24)
        .attr("height", 24)
        .attr("x", -12)
        .attr("y", -12)
        .attr("fill", "none")
        .attr("stroke", COLOR_SELECTED)
        .attr("stroke-width", 3)
        .attr("opacity", 0);

      // The Location Dot (Small Box)
      markersEnter.append("rect")
        .attr("class", "dot-pixel")
        .attr("width", 10)
        .attr("height", 10)
        .attr("x", -5)
        .attr("y", -5)
        .attr("fill", COLOR_MARKER)
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .attr("cursor", "pointer");
        
      // Text Label (Bitmap font style handled via CSS mostly, but simple SVG text here)
      markersEnter.append("text")
        .attr("class", "label-text")
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .attr("font-family", "'Press Start 2P', cursive")
        .attr("font-size", "10px")
        .style("text-shadow", "2px 2px 0px #000")
        .attr("pointer-events", "none")
        .attr("opacity", 0);

      const allMarkers = markersEnter.merge(markers);

      const isVisible = (d: GameLocation) => {
        const center = projection.invert!([width/2, height/2]);
        const distance = d3.geoDistance(center!, [d.coordinates.lng, d.coordinates.lat]);
        return distance < 1.57;
      };

      allMarkers.each(function(d) {
        const group = d3.select(this);
        if (!isVisible(d)) {
            group.style("display", "none");
            return;
        }
        
        const coords = projection([d.coordinates.lng, d.coordinates.lat]);
        if (!coords) return;

        group.style("display", "block");
        group.attr("transform", `translate(${coords[0]}, ${coords[1]})`);
        
        const isSelected = d.id === selectedLocationId;

        const dot = group.select(".dot-pixel");
        const box = group.select(".selection-box");
        const text = group.select(".label-text");

        dot
            .attr("fill", isSelected ? COLOR_SELECTED : COLOR_MARKER)
            .on("click", (event) => {
                event.stopPropagation();
                onLocationSelect(d.id);
            });

        if (isSelected) {
            box
                .attr("opacity", 1)
                .style("animation", "blink 0.5s step-end infinite alternate"); // Fast blinking
            
            text
                .attr("y", -20)
                .text(d.gameName)
                .attr("opacity", 1);
        } else {
            box.attr("opacity", 0).style("animation", "none");
            text.attr("opacity", 0);
        }
      });
    };

    draw();

    // Zoom Behavior
    const zoom = d3.zoom()
        .scaleExtent([0.5, 8])
        .on("zoom", (event) => {
            projection.scale(initialScale * event.transform.k);
            draw();
        });
    
    zoomBehaviorRef.current = zoom;

    // Apply zoom but disable mouse panning (leave that for drag)
    // We attach the zoom behavior, which respects existing transform on the element
    svg.call(zoom as any)
       .on("mousedown.zoom", null)
       .on("dblclick.zoom", null);

    // Drag Behavior
    const drag = d3.drag<SVGSVGElement, unknown>()
      .on("start", () => {
         if (transitionRef.current) {
             transitionRef.current.selection().interrupt();
             transitionRef.current = null;
         }
      })
      .on("drag", (event) => {
        const rotate = rotationRef.current;
        const k = 75 / projection.scale();
        rotationRef.current = [
          rotate[0] + event.dx * k,
          rotate[1] - event.dy * k,
          rotate[2]
        ];
        draw();
      });

    svg.call(drag);
    (svgRef.current as any).__draw = draw;

  }, [worldData, locations, selectedLocationId]);


  // Auto-rotate logic
  useEffect(() => {
    if ((!selectedLocationId && !viewCenter) || !worldData || !svgRef.current) return;
    
    let targetCoords: [number, number] | null = null;

    if (selectedLocationId) {
       const selected = locations.find(l => l.id === selectedLocationId);
       if (selected) {
           targetCoords = [selected.coordinates.lng, selected.coordinates.lat];
       }
    } else if (viewCenter) {
       targetCoords = [viewCenter.lng, viewCenter.lat];
    }

    if (!targetCoords) return;

    const targetRotation: [number, number, number] = [-targetCoords[0], -targetCoords[1], 0];
    const currentRotation = rotationRef.current;

    if (transitionRef.current) {
        transitionRef.current.selection().interrupt();
    }

    const interpolate = d3.interpolate(currentRotation, targetRotation);

    transitionRef.current = d3.select(svgRef.current).transition()
        .duration(1500)
        .ease(d3.easePolyInOut) 
        .tween("rotate", () => {
            return (t) => {
                rotationRef.current = interpolate(t);
                if ((svgRef.current as any).__draw) {
                    (svgRef.current as any).__draw();
                }
            };
        }) as any;

  }, [selectedLocationId, viewCenter, locations, worldData]);

  // Zoom Button Handlers
  const handleZoom = (factor: number) => {
      if (!selectionRef.current || !zoomBehaviorRef.current) return;
      
      selectionRef.current
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.current.scaleBy as any, factor);
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-black relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>
      
      <svg ref={svgRef} className="w-full h-full cursor-move relative z-10" />

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <button 
          onClick={() => handleZoom(1.5)}
          className="bg-black border-2 border-green-500 p-2 text-green-500 shadow-[4px_4px_0px_0px_#000] hover:bg-green-900 active:translate-y-1 active:shadow-none transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
        <button 
          onClick={() => handleZoom(0.66)}
          className="bg-black border-2 border-green-500 p-2 text-green-500 shadow-[4px_4px_0px_0px_#000] hover:bg-green-900 active:translate-y-1 active:shadow-none transition-all"
        >
          <Minus className="w-6 h-6" />
        </button>
      </div>

      <div className="absolute bottom-4 right-4 text-green-500 font-pixel text-[10px] pointer-events-none bg-black border border-green-500 p-2 shadow-[4px_4px_0px_0px_rgba(0,100,0,1)]">
        DRAG TO ROTATE // WHEEL TO ZOOM // CLICK TO SELECT
      </div>
    </div>
  );
};

export default Globe;