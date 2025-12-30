use std::path::PathBuf;

use eyre::ContextCompat as _;

const SCHEMA_DIR: &str = "./flatbuffers-schema/schema";

fn main() -> eyre::Result<()> {
    let rlbot_fbs_path = PathBuf::from(SCHEMA_DIR).join("rlbot.fbs");
    let mut declarations = planus_translation::translate_files(&[rlbot_fbs_path.as_path()])
        .context("planus translation failed")?;

    for (absolute_path, decl) in declarations.declarations.iter_mut() {
        // decl
    }

    napi_build::setup();

    Ok(())
}
