default:
    just --list

update-theme:
    git submodule update --remote themes/tabi
