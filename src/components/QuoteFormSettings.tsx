import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import {
    Plus,
    Trash2,
    Copy,
    Save,
    ArrowUp,
    ArrowDown,
    GripVertical,
    Eye,
    Link as LinkIcon,
    Check
} from "lucide-react";

import {
    DndContext,
    PointerSensor,
    KeyboardSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";

import {
    SortableContext,
    useSortable,
    arrayMove,
    verticalListSortingStrategy,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";

/* ---------------- types ---------------- */

type FieldType = "text" | "email" | "textarea" | "select";

type Condition = {
    fieldId: string;
    equals: string;
};

type Field = {
    id: string;
    label: string;
    type: FieldType;
    required: boolean;
    options?: string[];
    condition?: Condition;
};

/* ---------------- helpers ---------------- */

function parseOptions(input: string): string[] {
    const out: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const ch of input) {
        if (ch === '"') {
            inQuotes = !inQuotes;
            continue;
        }
        if (ch === "," && !inQuotes) {
            if (current.trim()) out.push(current.trim());
            current = "";
            continue;
        }
        current += ch;
    }

    if (current.trim()) out.push(current.trim());
    return [...new Set(out)];
}

function optionsToString(options?: string[]) {
    if (!options?.length) return "";
    return options.map(o => (o.includes(",") ? `"${o}"` : o)).join(", ");
}

function cloneField(field: Field): Field {
    return {
        ...field,
        id: crypto.randomUUID(),
        label: `${field.label} (copy)`,
    };
}

/* ---------------- sortable card ---------------- */

const SortableFieldCard: React.FC<{
    field: Field;
    allFields: Field[];
    index: number;
    total: number;
    onChange: (patch: Partial<Field>) => void;
    onRemove: () => void;
    onDuplicate: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}> = ({
          field,
          allFields,
          index,
          total,
          onChange,
          onRemove,
          onDuplicate,
          onMoveUp,
          onMoveDown,
      }) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: field.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--border-radius)",
        background: "var(--color-surface)",
        padding: "var(--spacing-md)",
        display: "grid",
        gap: 10,
        marginBottom: 12
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "28px 1fr 140px 120px 1fr",
                    gap: 10,
                    alignItems: "center",
                }}
            >
                <button
                    {...attributes}
                    {...listeners}
                    className="btn btn-outline"
                    style={{ width: 28, cursor: "grab" }}
                >
                    <GripVertical size={16} />
                </button>

                <input
                    className="form-control"
                    placeholder="Field Label"
                    value={field.label}
                    onChange={(e) => onChange({ label: e.target.value })}
                />

                <select
                    className="form-control"
                    value={field.type}
                    onChange={(e) =>
                        onChange({ type: e.target.value as FieldType })
                    }
                >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select</option>
                </select>

                <label style={{ display: "flex", gap: 6, fontSize: 13, alignItems: 'center' }}>
                    <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                            onChange({ required: e.target.checked })
                        }
                    />
                    Required
                </label>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                    <button className="btn btn-outline" onClick={onMoveUp} disabled={index === 0}>
                        <ArrowUp size={14} />
                    </button>
                    <button className="btn btn-outline" onClick={onMoveDown} disabled={index === total - 1}>
                        <ArrowDown size={14} />
                    </button>
                    <button className="btn btn-outline" onClick={onDuplicate}>
                        <Copy size={14} />
                    </button>
                    <button className="btn btn-outline" onClick={onRemove}>
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {field.type === "select" && (
                <input
                    className="form-control"
                    placeholder='Options: Renovation, "New build, phase 1"'
                    value={optionsToString(field.options)}
                    onChange={(e) =>
                        onChange({ options: parseOptions(e.target.value) })
                    }
                />
            )}

            <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: 'uppercase', marginBottom: 4 }}>
                    Conditional visibility
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <select
                        className="form-control"
                        style={{ flex: 1 }}
                        value={field.condition?.fieldId || ""}
                        onChange={(e) => {
                            const val = e.target.value;
                            onChange(val ? { condition: { fieldId: val, equals: "" } } : { condition: undefined });
                        }}
                    >
                        <option value="">Always visible</option>
                        {allFields
                            .filter(f => f.id !== field.id && f.type === "select")
                            .map(f => (
                                <option key={f.id} value={f.id}>
                                    Show when "{f.label}"
                                </option>
                            ))}
                    </select>

                    {field.condition && (
                        <input
                            className="form-control"
                            style={{ flex: 1 }}
                            placeholder="Trigger value"
                            value={field.condition.equals}
                            onChange={(e) =>
                                onChange({
                                    condition: {
                                        fieldId: field.condition!.fieldId,
                                        equals: e.target.value,
                                    },
                                })
                            }
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

/* ---------------- main page ---------------- */

const QuoteFormSettings: React.FC = () => {
    const uid = auth.currentUser?.uid;
    const navigate = useNavigate();

    const [companyName, setCompanyName] = useState("");
    const [slug, setSlug] = useState("");
    const [fields, setFields] = useState<Field[]>([]);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    // Build the public link: Priority to slug, fallback to uid
    const publicFormUrl = `${window.location.origin}/q/${slug || uid}`;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (!uid) return;

        (async () => {
            const userSnap = await getDoc(doc(db, "users", uid));
            if (userSnap.exists()) {
                const userData = userSnap.data();
                setCompanyName(userData.companyName || "");
                setSlug(userData.slug || "");
            }

            const snap = await getDoc(doc(db, "users", uid, "forms", "quoteRequest"));
            if (snap.exists()) setFields(snap.data().fields || []);
            else {
                setFields([
                    { id: "fullName", label: "Full name", type: "text", required: true },
                ]);
            }
        })();
    }, [uid]);

    const save = async () => {
        if (!uid) return;
        setSaving(true);
        try {
            await setDoc(
                doc(db, "users", uid, "forms", "quoteRequest"),
                { fields, updatedAt: serverTimestamp() },
                { merge: true }
            );
            toast.success("Form saved");
        } catch {
            toast.error("Save failed");
        } finally {
            setSaving(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicFormUrl);
        setCopied(true);
        toast.success("Link copied");
        setTimeout(() => setCopied(false), 2000);
    };

    const onDragEnd = (e: DragEndEvent) => {
        if (!e.over || e.active.id === e.over.id) return;
        setFields((prev) => {
            const oldIndex = prev.findIndex(f => f.id === e.active.id);
            const newIndex = prev.findIndex(f => f.id === e.over!.id);
            return arrayMove(prev, oldIndex, newIndex);
        });
    };

    return (
        <div className="container" style={{ maxWidth: 980, padding: '40px 20px' }}>
            <div style={{ marginBottom: 32 }}>
                <h1>Quote Form Builder</h1>
                <p style={{ color: "var(--color-text-secondary)" }}>
                    Configure the fields your clients see when requesting a quote for <strong>{companyName || "your business"}</strong>.
                </p>
            </div>

            <div style={{
                background: 'var(--color-primary-light)',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: 32,
                border: '1px solid var(--color-primary-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
            }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-primary-dark)' }}>
                    Your Public Quote Request Link
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <input
                        readOnly
                        className="form-control"
                        value={publicFormUrl}
                        style={{ background: 'var(--color-surface)', flex: 1 }}
                    />
                    <button className="btn btn-primary" onClick={copyToClipboard} style={{ minWidth: 120 }}>
                        {copied ? <Check size={16} /> : <LinkIcon size={16} />}
                        <span style={{ marginLeft: 8 }}>{copied ? "Copied!" : "Copy Link"}</span>
                    </button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {slug ? "Using your custom business slug." : "No slug set: using your unique ID. Go to Profile to set a slug."}
                </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16, borderTop: '1px solid var(--color-border)', paddingTop: 24 }}>
                <button
                    className="btn btn-outline"
                    onClick={() =>
                        setFields(p => [...p, {
                            id: crypto.randomUUID(),
                            label: "New field",
                            type: "text",
                            required: false,
                        }])
                    }
                >
                    <Plus size={16} /> Add field
                </button>

                <button className="btn btn-outline" onClick={() => window.open(publicFormUrl, '_blank')}>
                    <Eye size={16} /> View Form
                </button>

                <button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginLeft: 'auto' }}>
                    <Save size={16} /> {saving ? "Saving…" : "Save Changes"}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                        {fields.map((field, i) => (
                            <SortableFieldCard
                                key={field.id}
                                field={field}
                                allFields={fields}
                                index={i}
                                total={fields.length}
                                onChange={(patch) =>
                                    setFields(p => p.map(f => f.id === field.id ? { ...f, ...patch } : f))
                                }
                                onRemove={() => setFields(p => p.filter(f => f.id !== field.id))}
                                onDuplicate={() =>
                                    setFields(p => {
                                        const copy = [...p];
                                        copy.splice(i + 1, 0, cloneField(field));
                                        return copy;
                                    })
                                }
                                onMoveUp={() => i > 0 && setFields(p => arrayMove(p, i, i - 1))}
                                onMoveDown={() => i < fields.length - 1 && setFields(p => arrayMove(p, i, i + 1))}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};

export default QuoteFormSettings;