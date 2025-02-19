const fs = require("fs");

// Read the input file
const inputFile = "unsorted.gltf";
const outputFile = "sorted.gltf";

try {
  // Read and parse the GLTF file
  const gltfData = fs.readFileSync(inputFile, "utf8");
  const gltf = JSON.parse(gltfData);

  // Sort nodes by name
  const sortedNodes = [...gltf.nodes].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  // Create mapping from old node indices to new indices
  // "box3" (at index 0 in original), would find it at index 2 in sorted.
  const nodeIndexMap = {};
  gltf.nodes.forEach((node, oldIndex) => {
    // find where that same node ends up in the sorted array:
    const newIndex = sortedNodes.findIndex((n) => n.name === node.name);
    nodeIndexMap[oldIndex] = newIndex;
  });

  // Update scene nodes so the ordering is sorted
  const updatedScenes = gltf.scenes.map((scene) => {
    return {
      ...scene,
      nodes: scene.nodes.map((oldIndex) => nodeIndexMap[oldIndex]),
    };
  });

  // Sort materials by name
  let sortedMaterials = gltf.materials;
  let materialIndexMap = {};

  if (gltf.materials) {
    sortedMaterials = [...gltf.materials].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    // Create mapping from old node indices to new indices
    // "mat3" (at index 0 in original), would find it at index 2 in sorted.
    gltf.materials.forEach((material, oldIndex) => {
      const newIndex = sortedMaterials.findIndex(
        (m) => m.name === material.name
      );
      materialIndexMap[oldIndex] = newIndex;
    });

    //
    // update the mesh primitives material indicies to maintain consistent material references.
    //
    if (gltf.meshes) {
      gltf.meshes = gltf.meshes.map((mesh) => {
        if (mesh.primitives) {
          return {
            ...mesh,
            primitives: mesh.primitives.map((primitive) => {
              if (primitive.material !== undefined) {
                return {
                  ...primitive,
                  material: materialIndexMap[primitive.material],
                };
              }
              return primitive;
            }),
          };
        }
        return mesh;
      });
    }
  }

  // Create the new sorted GLTF
  const sortedGltf = {
    ...gltf,
    nodes: sortedNodes,
    materials: sortedMaterials,
    scenes: updatedScenes,
  };

  // Write the sorted GLTF to the output file
  fs.writeFileSync(outputFile, JSON.stringify(sortedGltf, null, 2), "utf8");
  console.log(`saved to ${outputFile}`);
} catch (error) {
  console.error(`Error: ${error.message}`);
}
