use std::io::Result;

fn main() -> Result<()> {
    tauri_build::build();

    // Generate protobuf code
    prost_build::compile_protos(
        &["../protocol.proto"],
        &["../"],
    )?;

    Ok(())
}
