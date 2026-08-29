# Graph Report - graphify  (2026-08-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2380 nodes · 4749 edges · 122 communities (116 shown, 6 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 563 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `281ccaa4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119

## God Nodes (most connected - your core abstractions)
1. `_read_text()` - 92 edges
2. `dispatch_command()` - 60 edges
3. `_make_id()` - 56 edges
4. `_rebuild_code()` - 47 edges
5. `_file_stem()` - 47 edges
6. `_extract_generic()` - 36 edges
7. `dispatch_install_cli()` - 34 edges
8. `extract()` - 33 edges
9. `_collect_js_symbol_resolution_facts()` - 30 edges
10. `write_callflow_html()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `__getattr__()` --calls--> `_always_on()`  [INFERRED]
  __main__.py → install.py
- `_dispatched_source_text()` --uses--> `FileSlice`  [INFERRED]
  llm.py → file_slice.py
- `extract_files_direct()` --uses--> `FileSlice`  [INFERRED]
  llm.py → file_slice.py
- `_extract_with_adaptive_retry()` --uses--> `FileSlice`  [INFERRED]
  llm.py → file_slice.py
- `_partition_semantic_files()` --uses--> `FileSlice`  [INFERRED]
  llm.py → file_slice.py

## Import Cycles
- None detected.

## Communities (122 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (92): _c_collect_type_refs(), _cpp_collect_type_refs(), _csharp_classify_base(), _csharp_extra_walk(), _csharp_method_receiver_types(), _csharp_namespace_id(), _csharp_namespace_name(), _csharp_pre_scan_interfaces() (+84 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (88): _augment_js_reexport_edges(), Compatibility wrapper for the JS/TS symbol-resolution post-pass., _SymbolResolutionFacts, _SymbolUseFact, _apply_symbol_resolution_facts(), _augment_symbol_resolution_edges(), _collect_python_symbol_resolution_facts(), _contained_in_package() (+80 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (70): extract_apex(), Path, Apex extractor. Moved verbatim from graphify/extract.py., Extract classes, interfaces, enums, methods, and Salesforce constructs from…, _file_stem(), Path, Stem used as the node-ID prefix for a file and its symbols. The full path…, extract_bash() (+62 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (68): _absolutize_ids_in(), _absolutize_source_files_in(), _body_content(), cache_dir(), cached_files(), cached_word_count(), check_semantic_cache(), _cleanup_stale_ast_entries() (+60 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (65): datetime, _log_path(), log_query(), _log_responses(), nodes_from_result(), Any, Path, Query logging for graphify — append-only JSONL, fail-silent. (+57 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (57): _adopt_pre_manifest_notes(), attach_hyperedges(), backup_if_protected(), _cap_filename(), _cypher_escape(), _cypher_label(), _dedup_node_filenames(), existing_graph_node_count() (+49 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (56): Get the name from a node using config.name_field, falling back to child types., _resolve_name(), _read_text(), _csharp_attribute_names(), _csharp_collect_type_refs(), _csharp_type_parameters_in_scope(), _java_collect_type_refs(), _java_declarator_names() (+48 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (50): _active_scan_root(), _build_link_index(), extract_markdown(), _nfc(), _parse_frontmatter(), _parse_frontmatter_fallback(), Path, Markdown extractor. Moved verbatim from graphify/extract.py. (+42 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (44): attach_graph_impact(), bold(), build_community_labels(), _c(), _ci_icon(), _classify(), cmd_prs(), compute_pr_impact() (+36 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (43): extract_csproj(), extract_lazarus_package(), extract_slnx(), extract_xaml(), _get_c_func_name(), _import_c(), _import_csharp(), _import_java() (+35 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (39): _cross_community_surprises(), _cross_file_surprises(), _cross_language(), _file_category(), find_import_cycles(), god_nodes(), graph_diff(), _is_concept_node() (+31 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (41): _augment_cpp_string_tests(), _canonicalize_csharp_namespace_nodes(), _check_tree_sitter_version(), extract(), extract_cpp(), _extract_parallel(), _extract_sequential(), _extract_single_file() (+33 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (41): _agents_platform_uninstall(), _agents_uninstall(), _amp_uninstall(), _antigravity_uninstall(), claude_uninstall(), codebuddy_uninstall(), _cursor_uninstall(), dispatch_install_cli() (+33 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (35): _make_id(), extract_blade(), Path, Laravel Blade template extractor. Moved verbatim from graphify/extract.py., Extract @include, <livewire:> components, and wire:click bindings from Blade…, _java_extra_walk(), _kotlin_extra_walk(), Emit enum member nodes, and a container node for a TS `namespace`/`module`.… (+27 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (36): _detached_launch(), _git_root(), _has_merge_attr(), _hooks_dir(), install(), _install_hook(), _load_graphifyrc(), _merge_attr_line() (+28 more)

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (36): _backend_supports_vision(), _balanced_object(), _custom_providers_path(), estimate_cost(), _get_tokenizer(), _json_fragment_candidates(), _json_object_candidates(), _label_batch_with_retry() (+28 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (34): _bash_make_id(), build_label_index(), build_python_symbol_index(), existing_edge_pairs(), _file_node_id_for_path(), find_unique_python_symbol(), ImportedSymbol, iter_raw_calls() (+26 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (34): _canonical_graph_for_compare(), _canonical_topology_for_compare(), _changed_path_candidates(), _check_shrink(), _git_head(), _is_read_only_event(), _is_remote_source(), _json_text() (+26 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (32): _best_cut(), bisect_slice(), expand_oversized_files(), FileSlice, is_splittable_text(), _pdf_text(), Path, Intra-file slicing for oversized text documents (#1369). The extraction packer… (+24 more)

### Community 19 - "Community 19"
Cohesion: 0.09
Nodes (30): CallflowOptions, classify_edges(), first_list(), html_comment_text(), infer_project_name(), load_graph(), load_labels(), load_report() (+22 more)

### Community 20 - "Community 20"
Cohesion: 0.09
Nodes (30): _llm_tiebreak(), Batch-resolve ambiguous pairs (score in [low, high)) via LLM., _backend_env_keys(), _bedrock_inference_config(), _bedrock_response_text(), _call_claude_cli(), _call_llm(), _claude_cli_envelope() (+22 more)

### Community 21 - "Community 21"
Cohesion: 0.09
Nodes (29): classify_file(), _env_command_args(), FileType, _has_coverage_artifacts(), _has_venv_markers(), _is_graphable_source(), _looks_like_paper(), _match_anchored_ignore_pattern() (+21 more)

### Community 22 - "Community 22"
Cohesion: 0.07
Nodes (30): extract_c(), extract_java(), extract_kotlin(), extract_lua(), extract_php(), extract_ruby(), extract_scala(), extract_swift() (+22 more)

### Community 23 - "Community 23"
Cohesion: 0.10
Nodes (29): BaseException, _bind_node_evidence(), _build_image_refs(), _dispatched_source_text(), extract_files_direct(), _extract_with_adaptive_retry(), _file_to_text(), _is_vision_image() (+21 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (27): _clone_repo(), _default_graph_path(), dispatch_command(), _enforce_graph_size_cap_or_exit(), _prune_graph_json_sources(), Path, graphify command dispatch — every non-install subcommand. Extracted verbatim…, Source files graph.json still references but the current scan no longer… (+19 more)

### Community 25 - "Community 25"
Cohesion: 0.09
Nodes (28): _anthropic_response_text(), _azure_client(), _backend_pkg_hint(), _call_azure(), _call_claude(), _call_openai_compat(), _extraction_system(), _mark_hollow() (+20 more)

### Community 26 - "Community 26"
Cohesion: 0.12
Nodes (24): _crossfile_fileanchored_blocked(), deduplicate_entities(), _is_code(), _is_variant_pair(), _make_minhash(), _merge_missing_attributes(), _numeric_tokens_differ(), _pick_winner() (+16 more)

### Community 27 - "Community 27"
Cohesion: 0.12
Nodes (23): _extract_spock_fallback(), Regex-based fallback for Spock spec files where tree-sitter-groovy cannot parse…, extract_terraform(), Path, Terraform extractor. Moved verbatim from graphify/extract.py., Extract Terraform/HCL blocks and the references between them via tree-sitter.…, _add_edge(), _add_node() (+15 more)

### Community 28 - "Community 28"
Cohesion: 0.08
Nodes (25): _import_js(), _dynamic_import_js(), _find_body(), _find_require_call(), _js_collect_pattern_idents(), _js_extra_walk(), _js_import_binds_external(), _js_local_bound_names() (+17 more)

### Community 29 - "Community 29"
Cohesion: 0.11
Nodes (24): generate_overview_graph(), generate_section_flowchart(), group_nodes_by_file(), mermaid_class_defs(), mermaid_init(), mermaid_section_id(), node_kind(), node_label() (+16 more)

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (14): _build_csharp_type_def_index(), CsharpNameResolver, _is_cs_file(), _metadata(), Path, C# cross-file resolution. The config-driven C# *extractor* (``extract_csharp``…, Namespace/using/alias-aware C# simple-name resolution. Factored out of…, Return deterministic ``(namespace, name) -> node_id`` C# type definitions. (+6 more)

### Community 31 - "Community 31"
Cohesion: 0.11
Nodes (22): build_community_index(), build_section_node_map(), _community_text(), derive_sections_from_communities(), detect_lang(), generate_header(), generate_nav(), _keyword_score() (+14 more)

### Community 32 - "Community 32"
Cohesion: 0.12
Nodes (23): detect(), _find_vcs_root(), _git_info_exclude(), _git_tracked_path_keys(), ignored_predicate(), _is_regular_file(), _load_dir_own_ignore(), _load_graphifyignore() (+15 more)

### Community 33 - "Community 33"
Cohesion: 0.19
Nodes (22): _canonical_edge(), _count_extra(), diagnose_extraction(), diagnose_file(), _edge_list(), _exact_signature(), format_diagnostic_json(), format_diagnostic_report() (+14 more)

### Community 34 - "Community 34"
Cohesion: 0.16
Nodes (22): _detect_url_type(), _download_binary(), _fetch_arxiv(), _fetch_html(), _fetch_tweet(), _fetch_webpage(), _html_to_markdown(), ingest() (+14 more)

### Community 35 - "Community 35"
Cohesion: 0.15
Nodes (21): cluster(), cohesion_score(), community_member_sigs(), label_communities_by_hub(), _native_leiden(), _partition(), Graph, Community detection on NetworkX graphs. Uses Leiden (graspologic) if available,… (+13 more)

### Community 36 - "Community 36"
Cohesion: 0.15
Nodes (22): _auto_follow_symlinks(), convert_office_file(), count_words(), docx_to_markdown(), extract_pdf_text(), _file_within_size_cap(), _md5_file(), _os_path() (+14 more)

### Community 37 - "Community 37"
Cohesion: 0.12
Nodes (21): Resolve cross-file Swift member calls (``recv.method()``) to the real…, Resolve cross-file Python qualified class-method calls (``ClassName.method()``)…, Resolve cross-file TS/JS member calls via constructor-injection type tables…, Resolve cross-file C++ member calls (``f.bar()``, ``f->bar()``, ``Foo::bar()``,…, Resolve C# member calls (``recv.Method()``) to the receiver's declared type…, Resolve Java member calls against the receiver's declared type. Explicit type…, Resolve cross-file Objective-C message sends (``[recv sel]``) to the real…, _resolve_cpp_member_calls() (+13 more)

### Community 38 - "Community 38"
Cohesion: 0.14
Nodes (22): _antigravity_finalize(), _antigravity_install(), _canonical_platform(), _copy_skill_file(), _cursor_install(), gemini_install(), install(), _kiro_install() (+14 more)

### Community 39 - "Community 39"
Cohesion: 0.12
Nodes (19): _coerce_deps(), extract_package_manifest(), is_package_manifest_path(), _parse_apm(), _parse_apm_fallback(), _parse_cargo(), _parse_pyproject(), _pep508_name() (+11 more)

### Community 40 - "Community 40"
Cohesion: 0.12
Nodes (20): dedupe_edges(), dedupe_nodes(), deduplicate_by_label(), disambiguate_file_labels_in_nodes(), _disambiguate_file_node_labels(), distinct_repo_tags(), _file_label_reassignments(), _is_file_node_label() (+12 more)

### Community 41 - "Community 41"
Cohesion: 0.16
Nodes (21): _abs_identity(), build_merge(), _build_prune_sets(), _derive_prune_root(), _infer_merge_root(), _is_ast_tier(), _load_existing_graph(), merge_raw_extraction() (+13 more)

### Community 42 - "Community 42"
Cohesion: 0.12
Nodes (21): derive_flow_chain(), edge_score(), generate_overview_cards(), node_degree_scores(), node_importance(), preferred_edges(), Counter, Aggregate inter-section edge counts and relation names. (+13 more)

### Community 43 - "Community 43"
Cohesion: 0.13
Nodes (20): _describe_node(), format_node_refs(), generate_call_table_rows(), generate_section_cards(), generate_section_intro(), is_zh(), pick_text(), Render node references as readable labels instead of internal IDs. (+12 more)

### Community 44 - "Community 44"
Cohesion: 0.11
Nodes (15): _max_graph_file_bytes(), Path, Resolve *host* once and return (family, validated_ip) for the first address…, HTTPConnection that resolves + validates DNS once, then connects to the exact…, HTTPSConnection variant of _SSRFGuardedHTTPConnection. Connects to the…, urllib handler that routes http:// through _SSRFGuardedHTTPConnection., urllib handler that routes https:// through _SSRFGuardedHTTPSConnection., Resolve *path* and verify it stays inside *base*. *base* defaults to the… (+7 more)

### Community 45 - "Community 45"
Cohesion: 0.16
Nodes (19): _claude_pretooluse_hooks(), _gemini_hook(), _install_claude_hook(), _install_codebuddy_hook(), _install_codex_hook(), _install_gemini_hook(), Return the absolute path to the graphify executable, with forward slashes.…, Add graphify PreToolUse hook to .codex/hooks.json. (+11 more)

### Community 46 - "Community 46"
Cohesion: 0.19
Nodes (15): MultiDiGraph, _build_probe_graph(), CapabilityCheck, _check(), MultigraphCapabilityResult, _probe_duplicate_key_overwrite_semantics(), _probe_keyed_parallel_edges(), probe_multigraph_capabilities() (+7 more)

### Community 47 - "Community 47"
Cohesion: 0.18
Nodes (18): NamedTuple, _compute_idf(), _cut_lines_to_budget(), _infer_context_filters(), _node_search_text(), _normalize_context_filters(), _QueryScores, Render pre-built lines under the same ~3-chars/token budget rule as… (+10 more)

### Community 48 - "Community 48"
Cohesion: 0.13
Nodes (18): _atomic_replace(), default_graph_json(), disambiguate_ambiguous_candidates(), _is_test_path(), load_node_link_graph(), _path_proximity_winner(), Path, Single source of truth for the graphify output-directory name. The output… (+10 more)

### Community 49 - "Community 49"
Cohesion: 0.14
Nodes (18): _batch_needs_llm_flag(), _batch_triggers_rebuild(), check_update(), _drain_pending(), _has_non_code(), _notify_only(), Path, Return whether rebuilds should honor VCS ignore files (default True). (+10 more)

### Community 50 - "Community 50"
Cohesion: 0.26
Nodes (16): affected_nodes(), AffectedHit, _as_repo_relative(), _bare_name(), format_affected(), _format_location(), load_graph(), _node_label() (+8 more)

### Community 51 - "Community 51"
Cohesion: 0.15
Nodes (17): build(), build_from_json(), _coerce_non_string_ids(), _doc_twin_remap(), edge_data(), edge_datas(), _fold_edge_aliases(), _fold_node_aliases() (+9 more)

### Community 52 - "Community 52"
Cohesion: 0.15
Nodes (17): detect_incremental(), _lexical_relative(), load_manifest(), _mtime_may_hide_a_rewrite(), _nfc(), String-space equivalent of…, NFC-normalize a path string used as a manifest key. On macOS, ``os.walk`` /…, Return ``key`` as a forward-slash relative path from ``root``. Keys outside… (+9 more)

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (15): _anthropic_content(), _bedrock_content(), _call_bedrock(), _image_notes(), _ImageRef, _openai_content(), Call AWS Bedrock via boto3 Converse API using the standard AWS credential chain., A single image destined for a vision request. `raw` is None when the image is… (+7 more)

### Community 54 - "Community 54"
Cohesion: 0.15
Nodes (11): _lsh_integrate(), _mh_coeffs(), MinHash, MinHashLSH, _optimal_lsh_params(), MinHash + band-LSH — datasketch-compatible drop-in (no scipy). datasketch.lsh…, MinHash sketch — same API as datasketch.MinHash for the subset used here., Numerical integration — replaces scipy.integrate.quad for LSH param search. (+3 more)

### Community 55 - "Community 55"
Cohesion: 0.12
Nodes (15): _build_http_app(), _build_server(), _filter_blank_stdin(), _main(), _max_server_contexts(), _MCPASGIApp, Filter blank lines from stdin before MCP reads it. Some MCP clients (Claude…, Build the configured low-level MCP Server (shared by every transport). All… (+7 more)

### Community 56 - "Community 56"
Cohesion: 0.23
Nodes (15): prune_repo_from_graph(), Remove all nodes tagged with repo_tag from G in-place. Returns count removed., _file_hash(), global_add(), global_list(), global_path(), global_remove(), _load_global_graph() (+7 more)

### Community 57 - "Community 57"
Cohesion: 0.13
Nodes (16): _emit_rescued_import(), extract_astro(), extract_js(), _extract_js_rationale(), extract_svelte(), extract_vue(), Extract classes, functions, arrow functions, and imports from a…, Recover ``import('…')`` edges the AST pass does not emit for plain JS/TS. tree-… (+8 more)

### Community 58 - "Community 58"
Cohesion: 0.13
Nodes (15): _devin_rules_uninstall(), _kilo_uninstall(), _kilo_uninstall_global(), _packaged_skill_refs_dir(), _print_banner(), graphify install/uninstall subsystem. The per-platform skill/hook installers…, Return the packaged references source dir for a progressive platform, else…, Remove .windsurf/rules/graphify.md. (+7 more)

### Community 59 - "Community 59"
Cohesion: 0.19
Nodes (14): _normalize_hyperedge_members(), Canonicalize a hyperedge's member list onto the `nodes` key, in place. If…, _append_rationale_attr(), _is_sentence_like_rationale_label(), load_validated_semantic_fragment(), Path, Load and validate a semantic chunk, rejecting oversize files before parsing.…, Clean up a semantic extraction fragment in-place. Operations: 1. Removes nodes… (+6 more)

### Community 60 - "Community 60"
Cohesion: 0.14
Nodes (14): _cpp_declarator_name(), _cpp_local_var_types(), Return the bare variable name from a C++ declaration declarator, unwrapping…, Collect ``var -> ClassName`` from local variable declarations in a C++ function…, extract_objc(), _objc_category_base_stem(), _objc_is_category(), _objc_local_var_types() (+6 more)

### Community 61 - "Community 61"
Cohesion: 0.24
Nodes (14): convert_google_workspace_file(), _extract_file_id_from_url(), _extract_resource_key(), Any, Path, Optional Google Workspace shortcut export support. Google Drive for desktop…, Export a Google Workspace shortcut to a Markdown sidecar. Returns the converted…, Extract a Drive file ID from common Google Docs/Drive URL shapes. (+6 more)

### Community 62 - "Community 62"
Cohesion: 0.20
Nodes (15): _devin_rules_install(), _install_kilo_plugin(), _kilo_config_path(), _kilo_config_write_path(), _load_json_like(), Path, Write .windsurf/rules/graphify.md for always-on Devin context., Write automated Kilo edits to kilo.json so existing JSONC stays untouched. (+7 more)

### Community 63 - "Community 63"
Cohesion: 0.14
Nodes (15): _community_label_lines(), detect_backend(), generate_community_labels(), label_communities(), _ollama_host_is_link_local_or_metadata(), _placeholder_community_labels(), True if *host* is, or resolves to, a link-local / cloud-metadata address.…, Warn if OLLAMA_BASE_URL looks unsafe; hard-block link-local/metadata (F3).… (+7 more)

### Community 64 - "Community 64"
Cohesion: 0.21
Nodes (14): build_whisper_prompt(), download_audio(), _get_whisper(), _get_yt_dlp(), is_url(), _model_name(), Path, Transcribe a video/audio file or URL to a .txt transcript. If video_path is a… (+6 more)

### Community 65 - "Community 65"
Cohesion: 0.20
Nodes (13): _estimate_tokens(), _hr(), print_benchmark(), Graph, _query_subgraph_tokens(), Token-reduction benchmark - measures how much context graphify saves vs naive…, Print a human-readable benchmark report., Return unicode_char if stdout can encode it, else ascii_fallback. Windows… (+5 more)

### Community 66 - "Community 66"
Cohesion: 0.20
Nodes (13): graph_has_legacy_ids(), _has_global_id(), _old_file_stems(), Pre-migration stem forms a semantic fragment may have used for ``rel``. Ordered…, Re-derive non-AST node ids from ``source_file`` using the canonical full-path…, Whether ``node``'s ID is global by construction rather than file-derived., Whether a loaded graph still uses pre-#1504 node IDs (parent-dir / filename…, _semantic_id_remap() (+5 more)

### Community 67 - "Community 67"
Cohesion: 0.18
Nodes (14): _hook_strict_enabled(), _is_cwd_relative(), _mark_session_denied(), _query_stamp_fresh(), Resolve strict mode: GRAPHIFY_HOOK_STRICT env overrides the baked-in flag…, True if a query/explain/path ran within GRAPHIFY_HOOK_STRICT_TTL (default…, Atomically claim a one-time strict block for this session. Returns True only on…, Shell-agnostic PreToolUse guard (#522). Reads the tool-call JSON from stdin… (+6 more)

### Community 68 - "Community 68"
Cohesion: 0.21
Nodes (12): _check_skill_version(), __getattr__(), main(), Path, graphify CLI - `graphify install` sets up the Claude Code skill., Warn if the installed skill is from an older graphify version., Parse a version string into a comparable integer tuple (``0.9.2`` -> ``(0, 9,…, Handle a downstream reader that closed the pipe early. Redirect stdout to… (+4 more)

### Community 69 - "Community 69"
Cohesion: 0.23
Nodes (13): _bfs(), _complete_induced_edges(), _dfs(), _display_graph_path(), _filter_graph_by_context(), _pick_seeds(), Graph, _query_graph_text() (+5 more)

### Community 70 - "Community 70"
Cohesion: 0.24
Nodes (5): _is_relative_to(), Resolve source_file values across current and legacy graph roots., Whether stored relative source_file paths resolve under ``root``. Samples the…, _relativize_source_files(), _StoredSourcePaths

### Community 71 - "Community 71"
Cohesion: 0.24
Nodes (11): _html_document_title(), _html_script(), _html_styles(), _hyperedge_script(), Graph, html — moved verbatim from graphify/export.py., Return the effective viz node limit, honoring GRAPHIFY_VIZ_NODE_LIMIT env var.…, Return a portable label for the graph.html <title>. Tracked artifacts must not… (+3 more)

### Community 72 - "Community 72"
Cohesion: 0.20
Nodes (10): extract_sql(), _norm_ident(), Path, Sql extractor. Moved verbatim from graphify/extract.py., Normalize a SQL identifier for name-based reference resolution. Splits on `.`,…, Extract tables, views, functions, and relationships from .sql files via tree-…, introspect_postgres(), _quote_ident() (+2 more)

### Community 73 - "Community 73"
Cohesion: 0.24
Nodes (10): _augment_systemverilog_semantics(), extract_verilog(), Path, Verilog extractor. Moved verbatim from graphify/extract.py., First `simple_identifier` under node in pre-order, or None. tree-sitter-verilog…, Extract modules, functions, tasks, package imports, instantiations, and…, _sv_collect_type_refs(), _sv_first_identifier() (+2 more)

### Community 74 - "Community 74"
Cohesion: 0.17
Nodes (12): _agents_install(), _agents_platform_install(), _amp_install(), _amp_legacy_cleanup(), _install_opencode_plugin(), _kilo_install(), Write graphify.js plugin and register it in opencode.json., Write the graphify section to the local AGENTS.md for always-on platforms. (+4 more)

### Community 75 - "Community 75"
Cohesion: 0.20
Nodes (12): _always_on(), claude_install(), codebuddy_install(), _install_skill_references(), Atomically install a packaged references/ sidecar next to SKILL.md. Stages the…, Write the graphify section to the local CLAUDE.md., Install the graphify skill and CODEBUDDY.md section for CodeBuddy., Read a packaged always-on instruction block from graphify/always_on/. The six… (+4 more)

### Community 76 - "Community 76"
Cohesion: 0.24
Nodes (10): LanguageResolver, Path, Registry for cross-file, language-specific resolution passes. Some…, One cross-file, language-specific resolution pass. ``resolve`` has the…, Append a resolver to the global registry and return it (for inline use)., Return a copy of the registered resolvers, in registration order., Run every resolver whose suffix appears in ``paths``. Behaviorally identical to…, register() (+2 more)

### Community 77 - "Community 77"
Cohesion: 0.20
Nodes (10): _defines_id(), _entropy(), _id_prefixes(), _norm(), Lowercase + collapse non-alphanumeric runs to space (Unicode-aware)., The ID prefixes a node extracted from ``source_file`` may legitimately mint. An…, True when the node's own source_file is the file its ID encodes. A doc that…, Shannon entropy in bits/char of the normalised label. (+2 more)

### Community 78 - "Community 78"
Cohesion: 0.22
Nodes (7): _communities_from_graph(), _GraphContextCache, _load_graph(), Thread-safe graph contexts: one pinned default plus an LRU of projects., Build one entry for an already-resolved path and known file key.…, Return a fresh context, retaining project contexts by LRU order.…, Reconstruct community dict from community property stored on nodes.

### Community 79 - "Community 79"
Cohesion: 0.38
Nodes (9): build_tree(), _common_root(), emit_html(), _make_truncation_leaf(), Any, Path, tree_html — emit a D3 v7 collapsible-tree HTML view of a graph. A self-…, Build a ``{name, total_count, children}`` hierarchy. Each leaf is either a code… (+1 more)

### Community 80 - "Community 80"
Cohesion: 0.25
Nodes (8): _bash_assignment_base(), _bash_source_suffix(), Path, Bash extractor. Moved verbatim from graphify/extract.py., Return the literal path suffix of a variable-built `source` argument, or None…, True if *target* is *ceiling* or lives beneath it, compared lexically…, Resolve a top-level assignment's value to a directory, or None if untracked.…, _within_tree()

### Community 81 - "Community 81"
Cohesion: 0.22
Nodes (8): IPv4Address, IPv6Address, _ip_is_blocked(), _NoFileRedirectHandler, Raise ValueError if *url* is not http or https, or targets a private/internal…, Redirect handler that re-validates every redirect target. Prevents open-…, Return True if *ip* falls in a private/reserved/internal range. Shared by…, validate_url()

### Community 82 - "Community 82"
Cohesion: 0.25
Nodes (8): _coerce_hyperedge_member_refs(), _coerce_id(), _hashable(), prefix_graph_for_global(), Coerce a hyperedge member list to hashable scalar ids, deduped in order.…, Return a copy of G with all node IDs prefixed with repo_tag::. Labels are…, Return a str for a numeric id, else the value unchanged. ``bool`` is excluded…, True when value can be a dict key / set member (same probe as the inline ``try:…

### Community 83 - "Community 83"
Cohesion: 0.29
Nodes (8): endpoint_id(), first_present(), normalize_edge(), normalize_node(), Return the first non-empty value for any candidate key., Normalize edge endpoints that may be strings or node-like objects., Normalize a graphify node across common graph.json schema variants., Normalize graphify edges while preserving original fields.

### Community 84 - "Community 84"
Cohesion: 0.46
Nodes (7): introspect_cargo(), _load_toml(), _member_manifest_paths(), Any, Path, Cargo manifest introspection for workspace-internal crate dependencies., Return crate nodes and internal dependency edges from Cargo manifests.

### Community 85 - "Community 85"
Cohesion: 0.32
Nodes (7): _is_csharp(), _method_label(), Member-level interface dispatch for C# (#3003). A C# call through a…, True when the node is a declaration that lives in a C# file. Every end of a…, Return a method node's bare name, for matching. Case is kept: C# is case…, Link each single-implementer interface method to its implementation. Purely…, resolve_csharp_interface_dispatch()

### Community 86 - "Community 86"
Cohesion: 0.25
Nodes (8): _generic_keyword_hit(), _is_env_template(), _is_prose_note(), _is_sensitive(), True for `.env.example` / `.envrc.sample` style committed templates (#2184)., A prose/note file (.md/.rst/...) whose stem is a multi-word topic slug is…, True if a generic secret keyword appears load-bearing in the filename. Secret-…, Return True if this file likely contains secrets and should be skipped.

### Community 87 - "Community 87"
Cohesion: 0.33
Nodes (7): _collision_rank(), _lifecycle_penalty(), Path, _rank_path(), 0 for active/in-progress paths, 2 for archived/done paths, 1 otherwise. Judged…, The root-relative form of ``source_file`` used for collision ranking. Mirrors…, A total order for choosing the survivor of an ID collision, independent of the…

### Community 88 - "Community 88"
Cohesion: 0.29
Nodes (7): _is_noise_dir(), Return True if this directory name looks like a venv, cache, or dep dir., collect_files(), extract_csharp(), Extract C# type declarations, methods, namespaces, and usings from a .cs file., _xaml_csharp_class_nodes(), _xaml_project_root()

### Community 89 - "Community 89"
Cohesion: 0.33
Nodes (6): push_to_falkordb(), push_to_neo4j(), Graph, graphdb — moved verbatim from graphify/export.py., Push graph directly to a running Neo4j instance via the Python driver.…, Push graph directly to a running FalkorDB instance via the Python SDK.…

### Community 90 - "Community 90"
Cohesion: 0.38
Nodes (6): _cpp_preprocess(), extract_fortran(), Path, Fortran extractor. Moved verbatim from graphify/extract.py., Run cpp -w -P on a capital-F Fortran file and return preprocessed bytes. Falls…, Extract programs, modules, subroutines, functions, use statements, and calls…

### Community 91 - "Community 91"
Cohesion: 0.29
Nodes (6): extract_go(), _go_collect_type_refs(), Path, Go extractor. Moved verbatim from graphify/extract.py., Walk a Go type expression; append (name, role) tuples., Extract functions, methods, type declarations, and imports from a .go file.

### Community 92 - "Community 92"
Cohesion: 0.29
Nodes (6): extract_rust(), Path, Rust extractor. Moved verbatim from graphify/extract.py., Walk a Rust type expression; append (name, role) tuples., Extract functions, structs, enums, traits, impl methods, and use declarations…, _rust_collect_type_refs()

### Community 93 - "Community 93"
Cohesion: 0.29
Nodes (7): _has_chinese(), _is_searchable(), _query_terms(), Segment Chinese text and keep the original term for exact matching., True if term is Chinese, non-English, or an English word longer than 2 chars., Split a query into searchable terms, segmenting Chinese text, then drop…, _segment_chinese()

### Community 94 - "Community 94"
Cohesion: 0.33
Nodes (6): html_anchor_id(), normalize_communities(), normalize_sections(), Generate a stable, unique HTML anchor ID., Normalize section community lists from JSON or simple strings., Ensure sections have safe unique IDs and an overview section first.

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (6): humanize_label(), node_display_name(), Readable node label for tables and summaries., Truncate without splitting Mermaid syntax., Convert graph labels into short labels people can scan in a diagram., truncate_text()

### Community 96 - "Community 96"
Cohesion: 0.33
Nodes (6): _is_ignored(), _is_scan_ignored(), _path_identity(), Portable comparison key for an existing filesystem path., Return True if the path should be ignored per .graphifyignore patterns. Uses…, Apply ignore rules while preserving Git-tracked paths. ``patterns`` combines…

### Community 97 - "Community 97"
Cohesion: 0.33
Nodes (6): extract_python(), _extract_python_rationale(), _is_autogenerated_python(), Return True if this Python file is auto-generated and its module docstring is…, Post-pass: extract docstrings and rationale comments from Python source.…, Extract classes, functions, and imports from a .py file via tree-sitter AST.

### Community 98 - "Community 98"
Cohesion: 0.33
Nodes (6): _kotlin_package_index(), Group per-file results by the Kotlin package they declare. ``kotlin_package``…, Rewrite Kotlin ``imports`` edge targets from the bare last segment to the node…, Resolve Kotlin fully-qualified call expressions (#2550).…, _resolve_kotlin_import_targets(), _resolve_kotlin_qualified_calls()

### Community 99 - "Community 99"
Cohesion: 0.33
Nodes (6): OpenerDirector, _build_opener(), Fetch *url* and return raw bytes. Protections applied: - URL scheme validated…, Fetch *url* and return decoded text (UTF-8, replacing bad bytes). Wraps…, safe_fetch(), safe_fetch_text()

### Community 100 - "Community 100"
Cohesion: 0.33
Nodes (6): _find_node(), find_node_ambiguity(), _find_node_tiers(), Return match tiers in precedence order: (source_exact, exact, prefix,…, Return node IDs whose label or ID matches the search term (diacritic-…, Return rival candidates when the winning match tier spans several source files.…

### Community 101 - "Community 101"
Cohesion: 0.40
Nodes (6): _get_trigram_index(), Character trigrams of `text`; for <3-char text the whole string is the key., Lazily build and cache a trigram -> node-position postings map on the graph.…, Node IDs whose text could contain any `needle` as a substring, via the trigram…, _trigram_candidates(), _trigrams()

### Community 102 - "Community 102"
Cohesion: 0.33
Nodes (6): _pick_scored_endpoint(), Body of the `shortest_path` MCP tool (module-level so tests can call it without…, Combined query scorer returning the existing ranked `(score, node_id)` list.…, Pick a path endpoint from a _score_nodes result, preferring full-token matches.…, _score_nodes(), _shortest_path_text()

### Community 105 - "Community 105"
Cohesion: 0.40
Nodes (5): _is_top_level_function_definition(), _node_label_key(), A free/top-level function def (label ``name()``), not a method or type. Methods…, Map unresolved no-source stubs to a unique real definition with the same label., _rewire_unique_stub_nodes()

### Community 106 - "Community 106"
Cohesion: 0.40
Nodes (4): extract_ocaml(), Path, OCaml extractor (own module, optional tree-sitter-ocaml dependency). Handles…, Extract modules, values, functions, types, variant constructors, `open`…

### Community 107 - "Community 107"
Cohesion: 0.40
Nodes (4): extract_sln(), Path, Sln extractor. Moved verbatim from graphify/extract.py., Extract projects and inter-project dependencies from a .sln file.

### Community 108 - "Community 108"
Cohesion: 0.50
Nodes (4): _pascal_raw_calls(), Cross-file resolution for Pascal/Delphi calls to inherited methods. The per-…, Resolve Pascal/Delphi calls to a method inherited across file boundaries.…, resolve_pascal_inherited_calls()

### Community 109 - "Community 109"
Cohesion: 0.50
Nodes (4): assert_valid(), Validate an extraction JSON dict against the graphify schema. Returns a list of…, Raise ValueError with all errors if extraction is invalid., validate_extraction()

### Community 110 - "Community 110"
Cohesion: 0.50
Nodes (3): link_shared_type_declarations(), Join the same declared type across repositories in a merged graph (#3007).…, Link identically declared types across repos. Returns the edge count added. A…

### Community 111 - "Community 111"
Cohesion: 0.50
Nodes (4): _content_token_swap(), True when tokens x and y read as one word misspelt, not two words (#2576). A…, True when two equal-token-count labels differ in at least one swapped content…, _same_word_variant()

### Community 112 - "Community 112"
Cohesion: 0.50
Nodes (4): _blank_keeping_newlines(), _normalize_cpp_cli(), Replace a match with spaces, but keep its line breaks. Byte length alone is not…, Rewrite C++/CLI spellings to standard C++ ones, or None if not C++/CLI. The…

### Community 113 - "Community 113"
Cohesion: 0.50
Nodes (4): extract_groovy(), _is_spock_file(), Return True when the file contains Spock-style ``def "feature"()`` methods that…, Extract classes, methods, constructors, and imports from a .groovy/.gradle…

### Community 114 - "Community 114"
Cohesion: 0.50
Nodes (4): _import_lua(), Extract require('module') from Lua variable_declaration nodes., Resolve a Lua require() module name to a node id. Lua module names use dots as…, _resolve_lua_import_target()

### Community 117 - "Community 117"
Cohesion: 0.67
Nodes (3): Strip control characters and cap length. Safe for embedding in JSON data…, sanitize_label(), _community_header()

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dispatch_command()` connect `Community 24` to `Community 3`, `Community 8`, `Community 10`, `Community 15`, `Community 17`, `Community 20`, `Community 33`, `Community 35`, `Community 49`, `Community 50`, `Community 51`, `Community 56`, `Community 59`, `Community 63`, `Community 65`, `Community 67`, `Community 68`, `Community 69`, `Community 71`, `Community 72`, `Community 78`, `Community 79`, `Community 84`, `Community 100`, `Community 102`, `Community 103`?**
  _High betweenness centrality (0.302) - this node is a cross-community bridge._
- **Why does `_rebuild_code()` connect `Community 17` to `Community 32`, `Community 35`, `Community 70`, `Community 41`, `Community 10`, `Community 11`, `Community 48`, `Community 49`, `Community 51`, `Community 19`, `Community 52`, `Community 24`?**
  _High betweenness centrality (0.260) - this node is a cross-community bridge._
- **Why does `extract()` connect `Community 11` to `Community 1`, `Community 3`, `Community 9`, `Community 105`, `Community 76`, `Community 48`, `Community 16`, `Community 17`, `Community 30`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Are the 91 inferred relationships involving `_read_text()` (e.g. with `_get_c_func_name()` and `_import_c()`) actually correct?**
  _`_read_text()` has 91 INFERRED edges - model-reasoned connections that need verification._
- **Are the 46 inferred relationships involving `dispatch_command()` (e.g. with `format_affected()` and `god_nodes()`) actually correct?**
  _`dispatch_command()` has 46 INFERRED edges - model-reasoned connections that need verification._
- **Are the 55 inferred relationships involving `_make_id()` (e.g. with `extract_apex()` and `make_id()`) actually correct?**
  _`_make_id()` has 55 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.024777933613838243 - nodes in this community are weakly interconnected._