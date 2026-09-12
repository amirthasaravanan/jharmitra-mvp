#!/bin/sh
. .venv/bin/activate
uvicorn backend.main:app --reload
