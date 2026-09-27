#!/bin/bash
set -e

# Inicializa la base de datos PostgreSQL del devcontainer.
#
# Es idempotente: `prisma db push` sincroniza el esquema siempre, pero las seeds
# solo se ejecutan si la base está vacía, porque el mock masivo empieza con
# DELETE FROM en todas las tablas y borraría los datos locales del desarrollador.
#
# Para recargar el mock a propósito: bun run seed:cli -s views,mocks/mock_grande,denormalizar_unidades

SEEDS="views,mocks/mock_grande,denormalizar_unidades"

echo "Esperando a PostgreSQL..."
for i in $(seq 1 60); do
    if bun -e "
        import { Client } from 'pg';
        const url = (await Bun.file('.env').text()).match(/^DATABASE_URL=\"?([^\"\n]+)\"?/m)?.[1];
        if (!url) { process.exit(1); }
        const c = new Client({ connectionString: url });
        try { await c.connect(); await c.end(); process.exit(0); } catch { process.exit(1); }
    " 2>/dev/null; then
        echo "PostgreSQL listo (intento $i)."
        break
    fi
    if [ "$i" -eq 60 ]; then
        echo "ERROR: PostgreSQL no respondió. Revisa .devcontainer/docker-compose.yml" >&2
        exit 1
    fi
    sleep 2
done

echo "Sincronizando el esquema (prisma db push)..."
bun prisma db push

echo "Comprobando si la base tiene datos..."
TIENE_DATOS=$(bun -e "
    import { Client } from 'pg';
    const url = (await Bun.file('.env').text()).match(/^DATABASE_URL=\"?([^\"\n]+)\"?/m)?.[1];
    const c = new Client({ connectionString: url });
    await c.connect();
    const { rows } = await c.query('SELECT EXISTS (SELECT 1 FROM unidades LIMIT 1) AS hay');
    await c.end();
    process.stdout.write(rows[0].hay ? 'si' : 'no');
")

if [ "$TIENE_DATOS" = "si" ]; then
    echo "La base ya tiene datos: se conservan (no se ejecutan las seeds)."
else
    echo "Base vacía: ejecutando seeds ($SEEDS)..."
    bun run prisma/seeds/index.ts -s "$SEEDS"
fi

echo "Base de datos lista."
