import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

function DependencyGraph({ graph, onNodeClick }) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect()
        setDimensions({ width: Math.max(width, 400), height: 600 })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    if (!graph || !graph.nodes || !svgRef.current) return

    const { nodes, edges } = graph
    const { width, height } = dimensions

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform)
      })

    svg.call(zoom)

    const container = svg.append('g')

    // Create arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#94a3b8')

    // Create simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40))

    // Create links
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrowhead)')

    // Create nodes
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        }))

    // Node circles
    node.append('circle')
      .attr('r', d => d.isDirect ? 14 : 10)
      .attr('fill', d => d.isDirect ? '#3b82f6' : '#94a3b8')
      .attr('stroke', d => {
        if (d.vulnerabilityCount > 0) return '#ef4444'
        return d.isDirect ? '#1d4ed8' : '#64748b'
      })
      .attr('stroke-width', d => d.vulnerabilityCount > 0 ? 3 : 2)
      .attr('opacity', d => d.isDirect ? 1 : 0.7)

    // Node labels
    node.append('text')
      .attr('dy', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#e2e8f0')
      .text(d => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name)

    // Version labels
    node.append('text')
      .attr('dy', 38)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#94a3b8')
      .text(d => d.version)

    // Tooltip
    node.append('title')
      .text(d => `${d.name}@${d.version}\n${d.isDirect ? 'Direct' : 'Transitive'} dependency\n${d.vulnerabilityCount} vulnerabilities`)

    // Click handler
    node.on('click', (event, d) => {
      event.stopPropagation()
      if (onNodeClick) onNodeClick(d)
    })

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => simulation.stop()
  }, [graph, dimensions, onNodeClick])

  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return (
      <div className="dependency-graph-empty">
        <p>No dependency graph data available.</p>
      </div>
    )
  }

  return (
    <div className="dependency-graph" ref={containerRef}>
      <div className="dependency-graph-header">
        <h3>Dependency Graph</h3>
        <div className="graph-legend">
          <span className="legend-item">
            <span className="legend-dot direct"></span> Direct
          </span>
          <span className="legend-item">
            <span className="legend-dot transitive"></span> Transitive
          </span>
          <span className="legend-item">
            <span className="legend-dot vulnerable"></span> Has Vulnerabilities
          </span>
        </div>
      </div>
      <div className="graph-controls">
        <small>Drag nodes to reposition • Scroll to zoom • Drag background to pan</small>
      </div>
      <svg ref={svgRef} className="graph-svg"></svg>
    </div>
  )
}

export default DependencyGraph
